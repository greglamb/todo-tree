#!/bin/bash

EXT=`realpath builds/todo-tree-1.0.0.vsix`

rm -rf node_modules

npm i
npm run package

code --uninstall-extension greglamb.todo-tree

rm -rf ~/.vscode/extensions/greglamb.todo-tree

#code --install-extension $EXT
