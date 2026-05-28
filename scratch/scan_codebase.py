import os
import re

src_dir = r"c:\Users\Tripathi\Documents\Projects\Adamant\Implementation\adamant\src"

def analyze_jsx_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract component name / exports
    component_name = os.path.basename(filepath).replace(".jsx", "")
    
    # Extract hooks (useState, useEffect, useContext)
    use_states = re.findall(r"const\s+\[([^\]]+)\]\s*=\s*useState", content)
    use_effects = len(re.findall(r"useEffect\s*\(", content))
    use_contexts = re.findall(r"useContext\s*\(([^)]+)\)", content)
    
    # Extract event handlers
    handlers = re.findall(r"const\s+(handle[a-zA-Z0-9_]+)\s*=", content)
    handlers += re.findall(r"function\s+(handle[a-zA-Z0-9_]+)\s*\(", content)
    
    # Extract interactable elements (e.g. Buttons, Inputs, select, Checkbox, Dropzone, TextField, Accordion, etc.)
    tags = set(re.findall(r"<([A-Z][a-zA-Z0-9_]*|input|select|button|textarea|Checkbox|TextField|IconButton|Accordion|Dialog|DialogTitle|DialogContent|DialogActions|Button)\b", content))
    
    return {
        "component_name": component_name,
        "use_states": [s.strip() for s in use_states],
        "use_effects": use_effects,
        "use_contexts": [c.strip() for c in use_contexts],
        "handlers": sorted(list(set(handlers))),
        "tags": sorted(list(tags))
    }

print("=== DIALOGS & OVERLAYS (src/components) ===")
components_dir = os.path.join(src_dir, "components")
for filename in os.listdir(components_dir):
    if filename.endswith(".jsx"):
        info = analyze_jsx_file(os.path.join(components_dir, filename))
        print(f"\nFile: components/{filename}")
        print(f"  States: {info['use_states']}")
        print(f"  Effects count: {info['use_effects']}")
        print(f"  Contexts: {info['use_contexts']}")
        print(f"  Handlers: {info['handlers']}")
        print(f"  Tags: {info['tags']}")

print("\n=== PAGES (src/pages) ===")
pages_dir = os.path.join(src_dir, "pages")
for filename in os.listdir(pages_dir):
    if filename.endswith(".jsx"):
        info = analyze_jsx_file(os.path.join(pages_dir, filename))
        print(f"\nFile: pages/{filename}")
        print(f"  States: {info['use_states']}")
        print(f"  Effects count: {info['use_effects']}")
        print(f"  Contexts: {info['use_contexts']}")
        print(f"  Handlers: {info['handlers']}")
        print(f"  Tags: {info['tags']}")
