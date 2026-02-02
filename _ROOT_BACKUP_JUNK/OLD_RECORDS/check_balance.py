
import re

def check_balance(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Stack for balance
    stack = []
    
    # Regex for tokens
    # We need to handle strings, comments, and braces
    # Simplified parser
    
    lines = content.split('\n')
    
    # We will just traverse char by char state machine
    # States: CODE, STRING_SINGLE, STRING_DOUBLE, STRING_BACKTICK, COMMENT_LINE, COMMENT_BLOCK
    
    state = 'CODE'
    i = 0
    length = len(content)
    
    line_num = 1
    col_num = 0
    
    while i < length:
        char = content[i]
        
        # Track line numbers
        if char == '\n':
            line_num += 1
            col_num = 0
            if state == 'COMMENT_LINE':
                state = 'CODE'
            elif state == 'STRING_SINGLE' or state == 'STRING_DOUBLE':
                 # Strings shouldn't cross lines usually unless escaped, but we'll leniently reset or assume valid?
                 # Actually in JS strings can't really cross lines unescaped.
                 pass
            i += 1
            continue
            
        col_num += 1
        
        if state == 'CODE':
            if char == '/' and i+1 < length and content[i+1] == '/':
                state = 'COMMENT_LINE'
                i += 1
            elif char == '/' and i+1 < length and content[i+1] == '*':
                state = 'COMMENT_BLOCK'
                i += 1
            elif char == "'":
                state = 'STRING_SINGLE'
            elif char == '"':
                state = 'STRING_DOUBLE'
            elif char == '`':
                state = 'STRING_BACKTICK'
            elif char in '({[':
                stack.append((char, line_num, col_num))
            elif char in ')}]':
                if not stack:
                    print(f"Error: Unexpected closing {char} at {line_num}:{col_num}")
                    return
                last, l, c = stack.pop()
                if (char == ')' and last != '(') or \
                   (char == '}' and last != '{') or \
                   (char == ']' and last != '['):
                    print(f"Error: Mismatched {char} at {line_num}:{col_num}, expected closing for {last} from {l}:{c}")
                    return
        
        elif state == 'STRING_SINGLE':
            if char == "'" and content[i-1] != '\\':
                state = 'CODE'
        elif state == 'STRING_DOUBLE':
            if char == '"' and content[i-1] != '\\':
                state = 'CODE'
        elif state == 'STRING_BACKTICK':
            if char == '`' and content[i-1] != '\\':
                state = 'CODE'
        elif state == 'COMMENT_BLOCK':
            if char == '*' and i+1 < length and content[i+1] == '/':
                state = 'CODE'
                i += 1
        
        i += 1
    
    if stack:
        print("Error: Unclosed items:")
        for item in stack:
            print(f"{item[0]} at {item[1]}:{item[2]}")
    else:
        print("Balance OK")

check_balance('src/components/assessments/biomechanics-form.tsx')
