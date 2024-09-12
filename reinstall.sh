#!/bin/bash

EXT=`realpath builds/todo-tree-1.0.0.vsix`

code --uninstall-extension greglamb.todo-tree
code --install-extension $EXT
