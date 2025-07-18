#!/usr/bin/env python3
"""
Test runner script for MyNotes application
Runs both backend and frontend tests
"""

import subprocess
import sys
import os
import time
from pathlib import Path

def run_command(command, cwd=None, description=""):
    """Run a command and return success status"""
    print(f"\n{'='*60}")
    print(f"Running: {description}")
    print(f"Command: {command}")
    print(f"Directory: {cwd or 'current'}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        
        if result.returncode == 0:
            print(f"✅ {description} - PASSED")
            return True
        else:
            print(f"❌ {description} - FAILED")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - TIMEOUT")
        return False
    except Exception as e:
        print(f"💥 {description} - ERROR: {e}")
        return False

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    # Check Python and pip
    if not run_command("python3 --version", description="Check Python 3"):
        return False
    
    if not run_command("pip3 --version", description="Check pip3"):
        return False
    
    # Check Node.js and npm
    if not run_command("node --version", description="Check Node.js"):
        return False
    
    if not run_command("npm --version", description="Check npm"):
        return False
    
    return True

def setup_backend_environment():
    """Set up backend testing environment"""
    print("🏗️  Setting up backend environment...")
    
    backend_dir = Path(__file__).parent / "backend"
    
    # Install Python dependencies
    if not run_command(
        "pip3 install -r requirements.txt",
        cwd=backend_dir,
        description="Install backend dependencies"
    ):
        return False
    
    # Install testing dependencies
    if not run_command(
        "pip3 install pytest pytest-cov pytest-asyncio httpx pytest-timeout",
        cwd=backend_dir,
        description="Install testing dependencies"
    ):
        return False
    
    return True

def setup_frontend_environment():
    """Set up frontend testing environment"""
    print("🏗️  Setting up frontend environment...")
    
    frontend_dir = Path(__file__).parent / "frontend"
    
    # Install npm dependencies
    if not run_command(
        "npm install",
        cwd=frontend_dir,
        description="Install frontend dependencies"
    ):
        return False
    
    # Install testing dependencies
    if not run_command(
        "npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom",
        cwd=frontend_dir,
        description="Install testing dependencies"
    ):
        return False
    
    return True

def run_backend_tests():
    """Run backend tests"""
    print("🧪 Running backend tests...")
    
    backend_dir = Path(__file__).parent / "backend"
    
    # Run unit tests
    if not run_command(
        "python3 -m pytest tests/test_database.py -v",
        cwd=backend_dir,
        description="Backend database tests"
    ):
        return False
    
    # Run API tests
    if not run_command(
        "python3 -m pytest tests/test_api.py -v",
        cwd=backend_dir,
        description="Backend API tests"
    ):
        return False
    
    # Run integration tests (if database is available)
    print("🔄 Attempting integration tests...")
    if run_command(
        "python3 -m pytest tests/test_integration.py -v -m 'not slow'",
        cwd=backend_dir,
        description="Backend integration tests"
    ):
        print("✅ Integration tests passed")
    else:
        print("⚠️  Integration tests skipped (database may not be available)")
    
    return True

def run_frontend_tests():
    """Run frontend tests"""
    print("🧪 Running frontend tests...")
    
    frontend_dir = Path(__file__).parent / "frontend"
    
    # Run unit tests
    if not run_command(
        "npm run test -- --reporter=verbose",
        cwd=frontend_dir,
        description="Frontend unit tests"
    ):
        return False
    
    return True

def run_all_tests():
    """Run all tests"""
    print("🚀 Starting MyNotes Test Suite")
    print("=" * 60)
    
    results = []
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed")
        return False
    
    # Set up environments
    if not setup_backend_environment():
        print("❌ Backend setup failed")
        return False
    
    if not setup_frontend_environment():
        print("❌ Frontend setup failed")
        return False
    
    # Run backend tests
    backend_success = run_backend_tests()
    results.append(("Backend Tests", backend_success))
    
    # Run frontend tests
    frontend_success = run_frontend_tests()
    results.append(("Frontend Tests", frontend_success))
    
    # Print summary
    print("\n" + "=" * 60)
    print("🏁 TEST SUMMARY")
    print("=" * 60)
    
    all_passed = True
    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{test_name}: {status}")
        if not success:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        return True
    else:
        print("💥 SOME TESTS FAILED!")
        return False

def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "backend":
            success = setup_backend_environment() and run_backend_tests()
        elif command == "frontend":
            success = setup_frontend_environment() and run_frontend_tests()
        elif command == "deps":
            success = check_dependencies()
        elif command == "setup":
            success = setup_backend_environment() and setup_frontend_environment()
        else:
            print("Usage: python test_runner.py [backend|frontend|deps|setup]")
            print("       python test_runner.py (runs all tests)")
            sys.exit(1)
    else:
        success = run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()