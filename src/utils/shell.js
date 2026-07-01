const { execa } = require('execa');

const run = async (cmd, args = [], options = {}) => {
  try {
    const result = await execa(cmd, args, {
      stdio: 'pipe',
      ...options,
    });
    return { success: true, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { success: false, stdout: error.stdout, stderr: error.stderr };
  }
};

const runLive = async (cmd, args = [], options = {}) => {
  return execa(cmd, args, { stdio: 'inherit', ...options });
};

const commandExists = async (cmd) => {
  const platform = process.platform;
  const check = platform === 'win32' ? 'where' : 'which';
  const result = await run(check, [cmd]);
  return result.success;
};

module.exports = { run, runLive, commandExists };
