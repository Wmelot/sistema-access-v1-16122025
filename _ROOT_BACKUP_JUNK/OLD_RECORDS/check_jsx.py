
import re

def check_jsx(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Simple regex-based tag parser. 
    # Ignores self-closing tags <Foo />
    # Ignores void tags (img, input, br, hr)
    # Ignores tags inside comments (simple check)
    
    # We strip comments first to make this easier? 
    # Or just use a simple state machine.
    
    lines = content.split('\n')
    tags = []
    
    void_tags = {'img', 'input', 'br', 'hr', 'area', 'base', 'col', 'embed', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
    
    # Primitive removal of comments
    # Remove /* ... */
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    # Remove // ...
    content = re.sub(r'//.*', '', content)
    
    # Find tags
    # <Tag ...> or </Tag> or <Tag ... />
    # We scan for <
    
    i = 0
    length = len(content)
    
    while i < length:
        if content[i] == '<':
            # Check if likely a tag
            if i+1 < length and (content[i+1].isalpha() or content[i+1] == '/' or content[i+1] == '>'):
                # Extract the tag content
                end = content.find('>', i)
                if end == -1: break
                
                tag_str = content[i+1:end]
                # Check for self-closing / at end
                is_self_closing = tag_str.strip().endswith('/')
                is_closing = tag_str.startswith('/')
                
                # Get tag name
                name_match = re.search(r'^/?([a-zA-Z0-9\-\.]*)', tag_str.strip())
                if name_match:
                    name = name_match.group(1)
                    
                    if not name: 
                         # <> fragment
                         name = 'fragment'
                    
                    if name in void_tags:
                        i = end + 1
                        continue
                        
                    if is_self_closing:
                        i = end + 1
                        continue
                        
                    if is_closing:
                        # Pop from stack
                        if not tags:
                            print(f"Error: Unexpected closing </{name}> around index {i}")
                        else:
                            last = tags.pop()
                            if last != name:
                                print(f"Error: Mismatched closing </{name}>, expected </{last}> around index {i}")
                                # Try to recover? 
                                # Maybe we just assume the previous one was forgotten to be closed?
                    else:
                        # Push to stack
                        tags.append(name)
                        
                i = end + 1
                continue
        i += 1
        
    if tags:
        print("Error: Unclosed tags:", tags)
    else:
        print("JSX Balance OK")

check_jsx('src/components/assessments/biomechanics-form.tsx')
