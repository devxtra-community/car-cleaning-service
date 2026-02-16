@echo off
setlocal
echo Mounting S: drive at project root...
subst S: /D 2>NUL
subst S: "c:\Users\sahil\Desktop\Car-Cleaning-Service"
if exist S:\ (
    echo S: drive mounted successfully.
    pushd S:\apps\mobile\supervisor-mobile\android
    echo Running gradlew from S:\apps\mobile\supervisor-mobile\android...
    call gradlew.bat assembleDebug --stacktrace --no-daemon
    if errorlevel 1 (
        echo Build failed with error code %errorlevel%
    ) else (
        echo Build succeeded!
    )
    popd
) else (
    echo Failed to mount S: drive.
)
subst S: /D
