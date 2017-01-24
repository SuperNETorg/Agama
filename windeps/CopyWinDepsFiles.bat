@echo OFF

reg Query "HKLM\Hardware\Description\System\CentralProcessor\0" | find /i "x86" > NUL && set OS=32BIT || set OS=64BIT

if %OS%==32BIT echo This is a 32bit operating system
if %OS%==64BIT echo This is a 64bit operating system

if %OS%==32BIT (
	echo This is a 32bit operating system
	echo
	echo
	echo Copying x86 files to C:\Windows\System32\ ...
	echo
	echo 
	copy /Y %USERPROFILE%\IguanaApp\resources\app\windeps\x86\ucrtbased.dll C:\Windows\System32\
	copy /Y %USERPROFILE%\IguanaApp\resources\app\windeps\x86\vcruntime140d.dll C:\Windows\System32\
	echo
	echo
	echo z86 Files Copied!
	echo
	echo
)

if %OS%==64BIT (
	echo This is a 64bit operating system
	echo 
	echo Copying x86 files to C:\Windows\SysWOW64\ ...
	echo 
	copy /Y %USERPROFILE%\IguanaApp\resources\app\windeps\x86\ucrtbased.dll C:\Windows\SysWOW64\
	copy /Y %USERPROFILE%\IguanaApp\resources\app\windeps\x86\vcruntime140d.dll C:\Windows\SysWOW64\
	echo 
	echo x86 Files Copied!
	echo 
	echo Copying x64 files to C:\Windows\System32\ ...
	echo 
	copy /Y %USERPROFILE%\IguanaApp\resources\app\windeps\x64\ucrtbased.dll C:\Windows\System32\
	copy /Y %USERPROFILE%\IguanaApp\resources\app\windeps\x64\vcruntime140d.dll C:\Windows\System32\
	echo 
	echo x64 Files Copied!
)

echo 
echo 
echo If you see 0 files copied message,
echo make sure to run this script as Administrator.
echo Right click the file or link and select option "Run As Administrator"
echo
echo
pause