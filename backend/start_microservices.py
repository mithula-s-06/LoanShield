import os
import sys
import time
import subprocess
import signal

# Paths
backend_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(backend_dir)
venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
if not os.path.exists(venv_python):
    venv_python = sys.executable

SERVICES = [
    {
        "name": "ML Risk Engine (ml-service)",
        "module": "microservices.ml_service.main",
        "port": 8001,
        "dir": os.path.join(backend_dir, "microservices", "ml_service")
    },
    {
        "name": "Underwriting Repository (application-service)",
        "module": "microservices.application_service.main",
        "port": 8002,
        "dir": os.path.join(backend_dir, "microservices", "application_service")
    },
    {
        "name": "Loan Products & Pricing (pricing-service)",
        "module": "microservices.pricing_service.main",
        "port": 8003,
        "dir": os.path.join(backend_dir, "microservices", "pricing_service")
    },
    {
        "name": "Intelligent API Gateway (api-gateway)",
        "module": "microservices.api_gateway.main",
        "port": 8000,
        "dir": os.path.join(backend_dir, "microservices", "api_gateway")
    }
]

processes = []

def signal_handler(sig, frame):
    print("\n[SHUTDOWN] Terminating all LoanShield microservices...")
    for p in processes:
        try:
            p.terminate()
        except Exception:
            pass
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def main():
    print("=" * 75)
    print("   LOANSHIELD MICROSERVICES ORCHESTRATION ENGINE")
    print("=" * 75)
    print(f"Python Runtime: {venv_python}")
    print(f"Cluster Components:")
    for s in SERVICES:
        print(f"  - {s['name']:<45} -> http://127.0.0.1:{s['port']}")
    print("=" * 75)

    env = os.environ.copy()
    env["PYTHONPATH"] = f"{backend_dir};{os.path.join(backend_dir, 'microservices')};{os.path.join(backend_dir, 'ml')}"

    for service in SERVICES:
        print(f"[LAUNCHING] {service['name']} on port {service['port']}...")
        cmd = [
            venv_python, "-m", "uvicorn",
            "main:app",
            "--host", "127.0.0.1",
            "--port", str(service["port"]),
            "--reload"
        ]
        
        proc = subprocess.Popen(
            cmd,
            cwd=service["dir"],
            env=env
        )
        processes.append(proc)
        time.sleep(1.0) # Grace period for port binding

    print("\n" + "=" * 75)
    print(" ALL 4 MICROSERVICES ARE RUNNING CONCURRENTLY!")
    print("   API Gateway: http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)")
    print("   ML Service:  http://127.0.0.1:8001 (Docs: http://127.0.0.1:8001/docs)")
    print("   App Service: http://127.0.0.1:8002 (Docs: http://127.0.0.1:8002/docs)")
    print("   Pricing Svc: http://127.0.0.1:8003 (Docs: http://127.0.0.1:8003/docs)")
    print("=" * 75)
    print("Press Ctrl+C to stop all microservices.\n")

    try:
        while True:
            time.sleep(1)
            # Check if any process terminated unexpectedly
            for i, p in enumerate(processes):
                if p.poll() is not None:
                    print(f"[WARNING] Service '{SERVICES[i]['name']}' exited unexpectedly with code {p.returncode}")
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
