#!/bin/bash
# MathGPT Enterprise - Lean4 Prover Environment Setup Script

echo "=========================================================="
echo "Installing elan (Lean Version Manager) and Lean4 Stable..."
echo "=========================================================="

# Check if curl is available
if ! command -v curl &> /dev/null
then
    echo "Error: curl is required but not installed. Exiting."
    exit 1
fi

# Download and install elan
curl https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh -sSf | sh -s -- -y --default-toolchain leanprover/lean4:stable

# Source environment
export PATH="$HOME/.elan/bin:$PATH"
source "$HOME/.elan/env"

echo "Checking installation success..."
lean --version

echo "=========================================================="
echo "Initializing Mathlib4 dependencies in current workspace..."
echo "=========================================================="

# Create a sample project to fetch Mathlib
mkdir -p lean_workspace
cd lean_workspace
lake init mathgpt_env
lake update

echo "Lean4 environment configuration completed successfully!"
