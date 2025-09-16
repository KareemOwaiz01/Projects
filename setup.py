"""
ScreenGuard Pro - Setup Script
Automated setup script for the ScreenGuard Pro application.
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and return the result."""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            cwd=cwd, 
            capture_output=True, 
            text=True, 
            check=True
        )
        print(f"✓ {command}")
        return result
    except subprocess.CalledProcessError as e:
        print(f"✗ {command}")
        print(f"Error: {e.stderr}")
        return None

def check_python_version():
    """Check if Python version is compatible."""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    print(f"✓ Python {version.major}.{version.minor}.{version.micro}")
    return True

def setup_backend():
    """Setup the FastAPI backend."""
    print("\n🔧 Setting up Backend...")
    
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    # Create virtual environment
    venv_dir = backend_dir / "venv"
    if not venv_dir.exists():
        print("Creating virtual environment...")
        if platform.system() == "Windows":
            run_command("python -m venv venv", cwd=backend_dir)
        else:
            run_command("python3 -m venv venv", cwd=backend_dir)
    
    # Activate virtual environment and install dependencies
    if platform.system() == "Windows":
        pip_cmd = str(venv_dir / "Scripts" / "pip")
        python_cmd = str(venv_dir / "Scripts" / "python")
    else:
        pip_cmd = str(venv_dir / "bin" / "pip")
        python_cmd = str(venv_dir / "bin" / "python")
    
    print("Installing backend dependencies...")
    run_command(f"{pip_cmd} install --upgrade pip", cwd=backend_dir)
    run_command(f"{pip_cmd} install -r requirements.txt", cwd=backend_dir)
    
    # Create .env file if it doesn't exist
    env_file = backend_dir / ".env"
    env_example = backend_dir / "env.example"
    if not env_file.exists() and env_example.exists():
        print("Creating .env file...")
        run_command(f"copy env.example .env", cwd=backend_dir)
    
    print("✓ Backend setup complete")
    return True

def setup_web():
    """Setup the Django web dashboard."""
    print("\n🔧 Setting up Web Dashboard...")
    
    web_dir = Path("web")
    if not web_dir.exists():
        print("❌ Web directory not found")
        return False
    
    # Create virtual environment
    venv_dir = web_dir / "venv"
    if not venv_dir.exists():
        print("Creating virtual environment...")
        if platform.system() == "Windows":
            run_command("python -m venv venv", cwd=web_dir)
        else:
            run_command("python3 -m venv venv", cwd=web_dir)
    
    # Activate virtual environment and install dependencies
    if platform.system() == "Windows":
        pip_cmd = str(venv_dir / "Scripts" / "pip")
        python_cmd = str(venv_dir / "Scripts" / "python")
    else:
        pip_cmd = str(venv_dir / "bin" / "pip")
        python_cmd = str(venv_dir / "bin" / "python")
    
    print("Installing web dependencies...")
    run_command(f"{pip_cmd} install --upgrade pip", cwd=web_dir)
    run_command(f"{pip_cmd} install -r requirements.txt", cwd=web_dir)
    
    # Create .env file if it doesn't exist
    env_file = web_dir / ".env"
    env_example = web_dir / "env.example"
    if not env_file.exists() and env_example.exists():
        print("Creating .env file...")
        run_command(f"copy env.example .env", cwd=web_dir)
    
    # Run Django migrations
    print("Running Django migrations...")
    run_command(f"{python_cmd} manage.py makemigrations", cwd=web_dir)
    run_command(f"{python_cmd} manage.py migrate", cwd=web_dir)
    
    # Create superuser (optional)
    print("Creating superuser...")
    print("You can create a superuser later with: python manage.py createsuperuser")
    
    print("✓ Web dashboard setup complete")
    return True

def create_startup_scripts():
    """Create startup scripts for easy development."""
    print("\n📝 Creating startup scripts...")
    
    # Backend startup script
    if platform.system() == "Windows":
        backend_script = """@echo off
echo Starting ScreenGuard Pro Backend...
cd backend
call venv\\Scripts\\activate
python run.py
pause
"""
        with open("start_backend.bat", "w") as f:
            f.write(backend_script)
        
        # Web startup script
        web_script = """@echo off
echo Starting ScreenGuard Pro Web Dashboard...
cd web
call venv\\Scripts\\activate
python run.py
pause
"""
        with open("start_web.bat", "w") as f:
            f.write(web_script)
    else:
        # Unix/Linux/Mac scripts
        backend_script = """#!/bin/bash
echo "Starting ScreenGuard Pro Backend..."
cd backend
source venv/bin/activate
python run.py
"""
        with open("start_backend.sh", "w") as f:
            f.write(backend_script)
        os.chmod("start_backend.sh", 0o755)
        
        web_script = """#!/bin/bash
echo "Starting ScreenGuard Pro Web Dashboard..."
cd web
source venv/bin/activate
python run.py
"""
        with open("start_web.sh", "w") as f:
            f.write(web_script)
        os.chmod("start_web.sh", 0o755)
    
    print("✓ Startup scripts created")
    return True

def main():
    """Main setup function."""
    print("🚀 ScreenGuard Pro Setup")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Setup backend
    if not setup_backend():
        print("❌ Backend setup failed")
        sys.exit(1)
    
    # Setup web dashboard
    if not setup_web():
        print("❌ Web dashboard setup failed")
        sys.exit(1)
    
    # Create startup scripts
    create_startup_scripts()
    
    print("\n🎉 Setup Complete!")
    print("=" * 50)
    print("To start the application:")
    print("1. Backend API: Run 'start_backend.bat' (Windows) or './start_backend.sh' (Unix)")
    print("2. Web Dashboard: Run 'start_web.bat' (Windows) or './start_web.sh' (Unix)")
    print("\nURLs:")
    print("- Backend API: http://localhost:8000")
    print("- API Docs: http://localhost:8000/api/docs")
    print("- Web Dashboard: http://localhost:8000")
    print("- Admin Panel: http://localhost:8000/admin")
    print("\nFor development, run both services simultaneously.")

if __name__ == "__main__":
    main()
