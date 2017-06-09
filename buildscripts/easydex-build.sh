#!/bin/bash
# Script to build gui for Agama App

[ -d ${WORKSPACE}/gui/EasyDEX-GUI ] && cd ${WORKSPACE}/gui/EasyDEX-GUI
[ -d ../gui/EasyDEX-GUI ] && cd ../gui/EasyDEX-GUI
[ -d gui/EasyDEX-GUI ] && cd gui/EasyDEX-GUI

echo "Building EasyDEX-GUI"
echo "Actual directory is: ${PWD}"

echo "Checkout to redux branch."
git checkout redux
git pull origin redux

[ -d react ] && cd react || echo "!!! I can't find react"
echo "Actual directory is: ${PWD}"

echo "Installing nodejs modules."
npm install 
npm install webpack

echo "Building EasyDEX-GUI app."
npm run build 
echo "EasyDEX-GUI is built!"