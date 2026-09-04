# Demo

This folder is a demo, not part of the library. An install of ste-rules never contains it.

It is a complete consumer: the import map, one script, and a test. Read it as a reference, or copy it as a starter:

```sh
npx tiged --mode=git https://github.com/pfaciana/ste-rules/demo my-tool
cd my-tool
npm run ste-rules:setup
node --test
node index.js notes.txt
```

The first command needs `--mode=git`, because the demo folder is not in the normal download archive.

The full guide is in the [library README](../README.md).
