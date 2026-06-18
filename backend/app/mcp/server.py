import sys
import json
from typing import Dict, Any
from app.mcp.tools import (
    run_sympy_tool,
    run_sagemath_tool,
    run_lean_tool,
    run_arxiv_tool,
    run_code_exec_tool,
    run_kg_tool,
    run_paper_analysis_tool,
    run_theorem_tool,
    run_proof_tool
)

TOOLS_DECLARATION = [
    {
        "name": "theorem_tool",
        "description": "Register a new mathematical theorem and node in the dependency graph.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "theorem_id": {"type": "string"},
                "title": {"type": "string"},
                "domain": {"type": "string"},
                "statement": {"type": "string"}
            },
            "required": ["theorem_id", "title", "domain", "statement"]
        }
    },
    {
        "name": "proof_tool",
        "description": "Verify informal proof steps and Lean4 goals.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "theorem_id": {"type": "string"},
                "proof_text": {"type": "string"},
                "lean_code": {"type": "string"}
            },
            "required": ["theorem_id", "proof_text"]
        }
    },
    {
        "name": "sympy_tool",
        "description": "Run algebra, integration, or differentiation via SymPy.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "expression": {"type": "string"},
                "operation": {"type": "string"},
                "variables": {"type": "array", "items": {"type": "string"}}
            },
            "required": ["expression", "operation"]
        }
    },
    {
        "name": "sagemath_tool",
        "description": "Run general mathematical equations in SageMath.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "lean_tool",
        "description": "Verify formal Lean4 proof statements.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "lean_code": {"type": "string"}
            },
            "required": ["lean_code"]
        }
    },
    {
        "name": "arxiv_tool",
        "description": "Search scientific research papers on ArXiv.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "limit": {"type": "integer"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "kg_tool",
        "description": "Trace theorem relationship mappings in Knowledge Graph.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "theorem_id": {"type": "string"}
            },
            "required": ["theorem_id"]
        }
    },
    {
        "name": "code_exec_tool",
        "description": "Safely run custom Python code scripts.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string"}
            },
            "required": ["code"]
        }
    },
    {
        "name": "paper_analysis_tool",
        "description": "Parse and extract theorem definitions from paper text blocks.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "paper_id": {"type": "string"},
                "text_content": {"type": "string"}
            },
            "required": ["paper_id", "text_content"]
        }
    }
]

def handle_json_rpc(request: Dict[str, Any]) -> Dict[str, Any]:
    req_id = request.get("id")
    method = request.get("method")
    params = request.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "serverInfo": {
                    "name": "MathGPT-Enterprise-MCP",
                    "version": "1.0.0"
                }
            }
        }

    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": TOOLS_DECLARATION
            }
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        args = params.get("arguments", {})

        try:
            result = None
            if tool_name == "theorem_tool":
                result = run_theorem_tool(**args)
            elif tool_name == "proof_tool":
                result = run_proof_tool(**args)
            elif tool_name == "sympy_tool":
                result = run_sympy_tool(**args)
            elif tool_name == "sagemath_tool":
                result = run_sagemath_tool(**args)
            elif tool_name == "lean_tool":
                result = run_lean_tool(**args)
            elif tool_name == "arxiv_tool":
                result = run_arxiv_tool(**args)
            elif tool_name == "kg_tool":
                result = run_kg_tool(**args)
            elif tool_name == "code_exec_tool":
                result = run_code_exec_tool(**args)
            elif tool_name == "paper_analysis_tool":
                result = run_paper_analysis_tool(**args)
            else:
                return {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {
                        "code": -32601,
                        "message": f"Tool not found: {tool_name}"
                    }
                }

            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(result, indent=2)
                        }
                    ]
                }
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {
                    "code": -32000,
                    "message": f"Execution error in tool {tool_name}: {str(e)}"
                }
            }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {
            "code": -32601,
            "message": f"Method not found: {method}"
        }
    }

def main():
    """CLI Entrypoint for MCP Server running on Stdin/Stdout."""
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            request = json.loads(line)
            response = handle_json_rpc(request)
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {
                    "code": -32700,
                    "message": f"Parse error: {str(e)}"
                }
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
