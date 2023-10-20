const fs = require('node:fs/promises');
const CREATE_FILE = 'create a file';
const DELETE_FILE = 'delete a file';
const RENAME_FILE = 'rename the file';
const ADD_TO_FILE = 'add to the file';

(async () => {
  const createFile = async (path) => {
    try {
      const existingFileHandle = await fs.open(path, 'r');
      await existingFileHandle.close();
      return console.log(`The file ${path} already exist!`);
      // create a new file
    } catch (error) {
      const newFileHandle = await fs.open(path, 'w');
      console.log('A new file was created.');
      newFileHandle.close();
    }
  };
  const deleteFile = async (path) => {
    try {
      await fs.unlink(path);
      return console.log(`file ${path} deleted successfuly.`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('No file at this path to remove');
      } else {
        console.log('An error occurred while removing the file.');
        console.log(error);
      }
    }
  };
  const renameFile = async (oldPath, newPath) => {
    try {
      await fs.rename(oldPath, newPath);
      return console.log(`file ${oldPath} renamed to ${newPath} successfuly.`);
    } catch (err) {
      console.log(err);
    }
  };

  let lastContent;

  const addToFile = async (path, newContent) => {
    try {
      if (lastContent === newContent) {
        console.log('No duplication');
        return;
      }
      const existingFileHandle = await fs.open(path, 'a');

      await existingFileHandle.write(newContent);
      await existingFileHandle.close();
      lastContent = newContent;
      return console.log(`The content added to file: ${path}.`);
    } catch (error) {
      console.log(error);
    }
  };
  const commandFileHandler = await fs.open('./command.txt', /*readonly*/ 'r');
  commandFileHandler.on('change', async () => {
    // get the file size
    const { size } = await commandFileHandler.stat();
    // alloate the buffer with the size of the file
    const buf = Buffer.alloc(size);

    // the location which we want to start filling the buffer
    const offset = 0;
    // how many bytes we want to read: whole document
    const length = buf.byteLength;
    // position the we want to start reading the file from
    const position = 0;

    // alwas read the while content
    await commandFileHandler.read(buf, offset, length, position);

    const command = buf.toString('utf-8');

    if (command.includes(CREATE_FILE)) {
      const filePath = command.substring(CREATE_FILE.length + 1);
      createFile(filePath);
    }

    if (command.includes(DELETE_FILE)) {
      const filePath = command.substring(DELETE_FILE.length + 1);
      deleteFile(filePath);
    }
    if (command.includes(RENAME_FILE)) {
      const paths = command.substring(RENAME_FILE.length + 1).split(' to ');
      renameFile(paths[0], paths[1]);
    }

    if (command.includes(ADD_TO_FILE)) {
      const parts = command.substring(ADD_TO_FILE.length + 1);
      const pathAndContent = parts.split(' => ');
      addToFile(pathAndContent[0], pathAndContent[1]);
    }
  });

  // watcher
  const watcher = fs.watch('./command.txt');
  for await (const event of watcher) {
    if (event.eventType === 'change') {
      commandFileHandler.emit('change');
    }
  }
})();
