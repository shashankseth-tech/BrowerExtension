@echo off
echo ========================================================
echo   Configuring Ollama for Browser Extension Access (CORS)
echo ========================================================
echo.
echo Setting OLLAMA_ORIGINS to * ...
setx OLLAMA_ORIGINS "*"
echo.
echo Closing running Ollama instances...
taskkill /F /IM "ollama.exe" /IM "ollama app.exe" >nul 2>&1
timeout /t 2 /nobreak >nul
echo.
echo Starting Ollama with updated settings...
if exist "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe" (
    start "" "%LOCALAPPDATA%\Programs\Ollama\ollama app.exe"
) else (
    start "" ollama serve
)
echo.
echo Ollama is restarting! Wait ~5 seconds, then refresh your extension.
timeout /t 4 /nobreak >nul
