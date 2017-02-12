#!/usr/bin/env bash
if [ -d "tmp" ]; then
  cd tmp
else
  mkdir tmp
  cd tmp
fi

if [ -d "EasyDEX-GUI" ]; then
  cd EasyDEX-GUI
  git pull
  cd ../
else
  git clone https://github.com/SuperNETorg/EasyDEX-GUI.git
fi

if [ -d "Iguana-application" ]; then
  cd Iguana-application
  git checkout 0.3.1
  git branch 0.3.1 --track origin/0.3.1
  git pull
else
  git clone https://github.com/SuperNETorg/Iguana-application.git -b 0.3.1
  cd Iguana-application
  git branch 0.3.1 --track origin/0.3.1
fi

bower install
npm install
gulp electron

cd ../../

rm "gui/EasyDEX-GUI" -rf
rm "gui/Iguana-GUI" -rf

cp -rf "tmp/Iguana-application/compiled/prod" "gui/Iguana-GUI"
cp -rf "tmp/EasyDEX-GUI" "gui/EasyDEX-GUI"
