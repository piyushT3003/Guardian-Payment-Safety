@echo off
echo Starting Guardian - AI Payment Safety Layer...
if exist venv\Scripts\activate (
    call venv\Scripts\activate
) else if exist ..\Guardian_Testing\venv\Scripts\activate (
    call ..\Guardian_Testing\venv\Scripts\activate
)
python app.py
pause
