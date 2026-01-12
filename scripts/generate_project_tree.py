import os

def generate_tree(startpath):
    # Directories to ignore completely
    IGNORE_DIRS = {'.git', '.next', 'node_modules', '.vercel', '.DS_Store', '.idea', '.vscode'}
    
    # Directories to show detailed content for
    DETAILED_DIRS = {'src', 'supabase', 'assessment-schema'}

    output = []

    for root, dirs, files in os.walk(startpath):
        # Filter directories in-place
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        folder_name = os.path.basename(root)
        
        # Determine if we should show contents of this folder
        # Root is always shown
        if level == 0:
            output.append(f'{folder_name}/')
        else:
            # Check if this folder is inside a DETAILED_DIR or IS one
            # Get the top-level folder relative to startpath
            rel_path = os.path.relpath(root, startpath)
            top_level = rel_path.split(os.sep)[0]
            
            if top_level in DETAILED_DIRS:
                output.append(f'{indent}{folder_name}/')
            else:
                # Limit depth for non-detailed folders
                # If we are AT the top level folder (e.g. public), print it
                if level == 1:
                    output.append(f'{indent}{folder_name}/')
                # If inside a non-detailed folder, do NOT print files or subfolders
                # But os.walk continues... we need to stop it or just not print
                continue

        # Files
        subindent = ' ' * 4 * (level + 1)
        
        # Logic to skip file printing for non-detailed folders
        if level > 0:
             rel_path = os.path.relpath(root, startpath)
             top_level = rel_path.split(os.sep)[0]
             if top_level not in DETAILED_DIRS:
                 continue

        for f in sorted(files):
            if f in IGNORE_DIRS: continue
            if f.startswith('.'): continue # Ignore dotfiles like .env (optional, but requested ignore)
            output.append(f'{subindent}{f}')

    return '\n'.join(output)

if __name__ == '__main__':
    print(generate_tree('.'))
