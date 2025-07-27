@echo off
echo Heroku Auto Scheduler Setup Script
echo =====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org/
    echo 2. Download and install the LTS version
    echo 3. Restart your terminal
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available!
    echo Please make sure Node.js is properly installed.
    pause
    exit /b 1
)

echo Node.js and npm are installed!
echo.

REM Install dependencies
echo Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.

REM Check if .env file exists
if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit the .env file and add your Heroku API token!
    echo.
)

REM Build the project
echo Building the TypeScript project...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build the project!
    pause
    exit /b 1
)

echo.
echo Setup completed successfully!
echo.
echo Next steps:
echo 1. Edit the .env file and add your Heroku API token
echo 2. Configure your app names and schedules
echo 3. Run: npm run dev (for development)
echo 4. Run: npm start (for production)
echo.
pause
