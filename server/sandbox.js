import { randomUUID } from 'node:crypto';
import { execFile as nodeExecFile } from 'node:child_process';
import { promisify } from 'node:util';
import { isAbsolute, relative, resolve } from 'node:path';
import { realpath } from 'node:fs/promises';

const execFile = promisify(nodeExecFile);
const RUNTIME_IMAGE = 'node:24-alpine';
const MAX_TIMEOUT_MS = 120_000;

export class SandboxUnavailableError extends Error {
  constructor(message = 'Isolated execution is unavailable. Install and start Docker before running imported code.') {
    super(message);
    this.name = 'SandboxUnavailableError';
    this.statusCode = 503;
    this.code = 'SANDBOX_UNAVAILABLE';
  }
}

export function buildDockerCreateArgs({ containerName, workspacePath, sourcePath }) {
  const args = [
    'create', '--name', containerName,
    '--network', 'none',
    '--read-only',
    '--memory', '512m', '--memory-swap', '512m', '--cpus', '1',
    '--pids-limit', '64',
    '--ulimit', 'nofile=1024:1024', '--ulimit', 'cpu=30:30',
    '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
    '--user', '10001:10001',
    '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m',
    '--mount', `type=bind,src=${workspacePath},dst=/workspace,rw`,
  ];
  if (sourcePath) args.push('--mount', `type=bind,src=${sourcePath},dst=/source,readonly`);
  args.push('--workdir', '/workspace', '--entrypoint', 'node', RUNTIME_IMAGE, '-e', 'setInterval(() => {}, 60_000)');
  return args;
}

async function resolveWorkspace(workspaceRoot, workspacePath) {
  const root = await realpath(resolve(workspaceRoot));
  const workspace = await realpath(resolve(workspacePath));
  const relativePath = relative(root, workspace);
  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error('Sandbox workspace must be a child of its managed root.');
  }
  return { root, workspace };
}

export async function runInIsolatedContainer({
  workspaceRoot,
  workspacePath,
  sourcePath,
  command,
  args = [],
  timeoutMs = 30_000,
}, { execute = execFile, dockerPath = 'docker' } = {}) {
  if (typeof command !== 'string' || !command.trim() || !Array.isArray(args) || args.some((arg) => typeof arg !== 'string')) {
    throw new TypeError('Sandbox command and arguments must be strings.');
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS) {
    throw new RangeError(`Sandbox timeout must be between 1 and ${MAX_TIMEOUT_MS} milliseconds.`);
  }

  const { workspace } = await resolveWorkspace(workspaceRoot, workspacePath);
  let safeSourcePath;
  if (sourcePath) {
    safeSourcePath = await realpath(resolve(sourcePath));
    if (safeSourcePath === workspace) throw new Error('Original source and sandbox workspace must be separate.');
  }

  try {
    await execute(dockerPath, ['version', '--format', '{{.Server.Version}}'], { timeout: 3_000, windowsHide: true });
  } catch {
    throw new SandboxUnavailableError();
  }

  const containerName = `phoenix-${randomUUID()}`;
  let created = false;
  try {
    await execute(dockerPath, buildDockerCreateArgs({ containerName, workspacePath: workspace, sourcePath: safeSourcePath }), {
      timeout: 10_000, windowsHide: true, maxBuffer: 1024 * 1024,
    });
    created = true;
    await execute(dockerPath, ['start', containerName], { timeout: 10_000, windowsHide: true });
    const result = await execute(dockerPath, ['exec', '--workdir', '/workspace', containerName, command, ...args], {
      timeout: timeoutMs, windowsHide: true, maxBuffer: 2 * 1024 * 1024,
    });
    return {
      containerName,
      exitCode: 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      isolated: true,
    };
  } catch (error) {
    if (error?.killed || error?.code === 'ETIMEDOUT') {
      throw Object.assign(new Error('Sandbox execution exceeded its time limit.'), { code: 'SANDBOX_TIMEOUT', statusCode: 408 });
    }
    throw Object.assign(new Error(`Sandbox execution failed: ${error?.stderr?.toString().trim() || error?.message || 'unknown error'}`), {
      code: 'SANDBOX_EXECUTION_FAILED', statusCode: 500,
    });
  } finally {
    if (created) {
      await execute(dockerPath, ['rm', '--force', containerName], { timeout: 10_000, windowsHide: true }).catch(() => {});
    }
  }
}
