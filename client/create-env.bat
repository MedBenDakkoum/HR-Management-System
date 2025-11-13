@echo off
REM Simple script to create .env file for frontend
REM Usage: create-env.bat [backend-url]

SET BACKEND_URL=%1
IF "%BACKEND_URL%"=="" SET BACKEND_URL=http://localhost:10000

echo.
echo ========================================
echo   Frontend .env File Creator
echo ========================================
echo.

IF EXIST .env (
    echo Warning: .env file already exists!
    echo.
    echo Current content:
    type .env
    echo.
    echo Press Ctrl+C to cancel, or
    pause
)

echo Creating .env file...
echo.

(
echo # API Configuration
echo # Backend API base URL
echo.
echo VITE_API_BASE_URL=%BACKEND_URL%
echo.
echo # Examples:
echo # Production: VITE_API_BASE_URL=https://your-api-domain.com
echo # Local network: VITE_API_BASE_URL=http://192.168.1.100:10000
) > .env

echo.
echo ✅ .env file created successfully!
echo.
echo 📝 Configuration:
echo    VITE_API_BASE_URL=%BACKEND_URL%
echo.
echo 🚀 Next steps:
echo    1. Restart frontend dev server: npm run dev
echo    2. Check browser console for API URL
echo    3. Test API calls
echo.
echo 💡 To change URL:
echo    - Edit: %CD%\.env
echo    - Or run: create-env.bat YOUR_NEW_URL
echo    - Restart dev server
echo.

pause

