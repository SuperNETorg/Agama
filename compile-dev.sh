#!/usr/bin/env bash
cd "tmp/Iguana-application"

gulp prod

cd ../../

rm "gui/Iguana-GUI" -rf

cp -rf "tmp/Iguana-application/compiled/prod" "gui/Iguana-GUI"