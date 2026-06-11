import os
import zipfile
import xml.etree.ElementTree as ET
import re

WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
PARA = WORD_NAMESPACE + 'p'
TEXT = WORD_NAMESPACE + 't'
TBL = WORD_NAMESPACE + 'tbl'
TR = WORD_NAMESPACE + 'tr'
TC = WORD_NAMESPACE + 'tc'

def get_docx_data(path):
    """
    Extract list items and tables from docx file.
    """
    if not os.path.exists(path):
        return set(), []
    
    list_items = set()
    tables = []
    
    with zipfile.ZipFile(path) as docx:
        xml_content = docx.read('word/document.xml')
        root = ET.fromstring(xml_content)
        body = root.find(WORD_NAMESPACE + 'body')
        if body is None:
            return list_items, tables
            
        for child in body:
            if child.tag == PARA:
                # check if list
                numPr = child.find(f'.//{WORD_NAMESPACE}numPr')
                pStyle = child.find(f'.//{WORD_NAMESPACE}pStyle')
                is_list = numPr is not None or (pStyle is not None and pStyle.get(WORD_NAMESPACE + 'val', '').lower() == 'listparagraph')
                
                texts = [n.text for n in child.iter(TEXT) if n.text]
                p_text = ''.join(texts).strip()
                if p_text and is_list:
                    list_items.add(p_text)
            elif child.tag == TBL:
                rows_data = []
                for tr in child.findall(TR):
                    row = []
                    for tc in tr.findall(TC):
                        tc_texts = [n.text for n in tc.iter(TEXT) if n.text]
                        row.append(''.join(tc_texts).strip())
                    rows_data.append(row)
                if rows_data:
                    tables.append(rows_data)
                    
    return list_items, tables

def is_code_line(line):
    stripped = line.strip()
    if not stripped:
        return True # empty lines are fine inside code blocks
    
    # Go code indicators
    go_keywords = ['package ', 'import ', 'type ', 'func ', 'struct ', 'interface ', 'var ', 'const ', 'return ', 'go ', 'defer ', 'if ', 'for ', 'switch ', 'case ', 'select ', 'default:', '}', '{']
    if any(stripped.startswith(w) for w in go_keywords):
        return True
    
    # SQL indicators
    sql_keywords = ['CREATE TABLE', 'CREATE ', 'INSERT INTO', 'SELECT ', 'UPDATE ', 'DELETE ', 'DROP ', 'ALTER ']
    if any(stripped.upper().startswith(w) for w in sql_keywords):
        return True
        
    # Standard operators
    if any(op in stripped for op in [':=', '&&', '||', '<-', '->', '==', '!=', 'gorm.Model', 'sql.DB', 'context.Context', 'err != nil', 'db *sql.DB']):
        return True
        
    # Braces and indentation
    if line.startswith((' ', '\t', '    ')):
        return True
    if stripped.endswith(('{', '}', '(', ')', ';', ',')):
        return True
    return False

def format_markdown_table(table_data):
    """
    Convert 2D table array to markdown table string.
    """
    if not table_data:
        return ""
    col_widths = [max(len(str(row[i])) for row in table_data) for i in range(len(table_data[0]))]
    
    lines = []
    # Header
    header = "| " + " | ".join(str(cell).ljust(col_widths[idx]) for idx, cell in enumerate(table_data[0])) + " |"
    lines.append(header)
    # Divider
    divider = "| " + " | ".join("-" * col_widths[idx] for idx in range(len(table_data[0]))) + " |"
    lines.append(divider)
    # Rows
    for row in table_data[1:]:
        row_str = "| " + " | ".join(str(cell).ljust(col_widths[idx]) for idx, cell in enumerate(row)) + " |"
        lines.append(row_str)
        
    return "\n".join(lines)

def process_blog_file(md_path, docx_paths):
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Replace non-breaking spaces
    content = content.replace('\xa0', ' ')
    
    # Get docx lists and tables
    all_list_items = set()
    all_tables = []
    for dp in docx_paths:
        li, tb = get_docx_data(dp)
        all_list_items.update(li)
        all_tables.extend(tb)
        
    # Split content into frontmatter and body
    parts = content.split('---', 2)
    if len(parts) < 3:
        print(f"Skipping {md_path} - frontmatter not found")
        return
        
    frontmatter = parts[1]
    body = parts[2]
    
    # Let's replace table sequences with markdown tables in body
    # We do this by searching for the cells in the body text
    body_lines = body.split('\n')
    
    # Process tables first to avoid breaking lists
    for tbl in all_tables:
        flat_cells = [cell.strip() for row in tbl for cell in row if cell.strip()]
        if not flat_cells:
            continue
            
        # Find this sequence in body_lines
        start_idx = -1
        end_idx = -1
        
        # We look for where flat_cells[0] is in a line, then match subsequent cells
        for idx in range(len(body_lines)):
            if flat_cells[0].lower() in body_lines[idx].strip().lower():
                # Check if subsequent lines match the rest of the cells
                match_count = 0
                body_idx = idx
                cell_idx = 0
                
                while cell_idx < len(flat_cells) and body_idx < len(body_lines):
                    b_line = body_lines[body_idx].strip()
                    if not b_line:
                        body_idx += 1
                        continue
                    # Check if cell text is in the line
                    if flat_cells[cell_idx].lower() in b_line.lower():
                        match_count += 1
                        cell_idx += 1
                    body_idx += 1
                    
                if match_count == len(flat_cells):
                    start_idx = idx
                    end_idx = body_idx
                    break
                    
        if start_idx != -1 and end_idx != -1:
            # Replace lines from start_idx to end_idx with the formatted table
            md_table = format_markdown_table(tbl)
            body_lines[start_idx:end_idx] = [md_table]
            
    # Now process lists, code blocks, and diagrams in body_lines
    new_lines = []
    in_code = False
    in_diagram = False
    
    i = 0
    while i < len(body_lines):
        line = body_lines[i]
        stripped = line.strip()
        
        # Diagram chars check
        diagram_chars = ['┌', '┬', '┐', '├', '┼', '┤', '└', '┴', '┘', '─', '│', '▼', '▲', '↓', '↑']
        has_diagram_chars = any(c in line for c in diagram_chars)
        
        if stripped.startswith('```'):
            if in_code:
                # We are in a code block and see a closing fence.
                # Check if the next non-empty lines look like code or opening fence.
                next_idx = i + 1
                while next_idx < len(body_lines) and body_lines[next_idx].strip() == "":
                    next_idx += 1
                
                if next_idx < len(body_lines):
                    next_line = body_lines[next_idx].strip()
                    if next_line.startswith('```') or (is_code_line(body_lines[next_idx]) and not next_line.startswith('#')):
                        # Skip closing fence and continue
                        i = next_idx
                        if body_lines[i].strip().startswith('```'):
                            i += 1 # skip next opening fence
                        new_lines.append("")
                        continue
                    else:
                        in_code = False
                        new_lines.append('```')
                else:
                    in_code = False
                    new_lines.append('```')
            else:
                in_code = True
                new_lines.append(stripped)
        elif not in_code:
            # Handle diagrams
            if has_diagram_chars:
                if not in_diagram:
                    new_lines.append('```text')
                    in_diagram = True
                new_lines.append(line)
            else:
                if in_diagram:
                    new_lines.append('```')
                    in_diagram = False
                
                # Check if list item
                is_hdr = stripped.startswith('#')
                is_md_list = stripped.startswith(('-', '*', '+', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.'))
                is_img = stripped.startswith('!')
                
                if stripped and not is_hdr and not is_md_list and not is_img:
                    # Check if stripped matches any list item from docx
                    matched = False
                    for li in all_list_items:
                        # Allow fuzzy match since quotes/dashes might differ slightly
                        li_clean = re.sub(r'[^\w\s]', '', li).strip().lower()
                        stripped_clean = re.sub(r'[^\w\s]', '', stripped).strip().lower()
                        if li_clean and stripped_clean == li_clean:
                            matched = True
                            break
                    
                    if matched:
                        new_lines.append("- " + stripped)
                    else:
                        new_lines.append(line)
                else:
                    new_lines.append(line)
        else:
            # We are in code block
            # If we see a heading, we must close the code block
            if stripped.startswith('#'):
                new_lines.append('```')
                new_lines.append("")
                in_code = False
            new_lines.append(line)
        i += 1
        
    if in_diagram:
        new_lines.append('```')
        
    # Reassemble and save
    new_body = '\n'.join(new_lines)
    cleaned_content = f"---{frontmatter}---{new_body}"
    
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(cleaned_content)
    print(f"Processed and cleaned: {os.path.basename(md_path)}")

# Run for all mapped files
docx_dir = r"c:\Users\Tanmoy95\Desktop\pROTFOLIO\My-Info and requirement\blogs i write"
blog_dir = r"c:\Users\Tanmoy95\Desktop\pROTFOLIO\src\content\blog"

mappings = {
    "building-high-concurrency-dag-engine.md": ["DAG.docx"],
    "caching-high-level-design.md": ["Caching HLD.docx"],
    "dag-execution-engines-orchestration.md": ["dAG THEORY.docx"],
    "dependency-inversion-principle-golang.md": ["Dependency Inversion Principle (DIP) in Solid -D.docx"],
    "event-driven-architecture-hld.md": ["Event-Driven Architecture (HLD).docx"],
    "kubernetes-core-architecture-notes.md": ["Kubernaties Notes.docx"],
    "liskov-substitution-principle-golang.md": ["Liskov Substitution Principle(LSV) solid (LLD).docx", "Liskov Substitution Principle(solid-L)(LLD).docx"],
    "oop-in-go-low-level-design.md": ["Object Oriented Programming Go(LLD).docx"],
    "scalability-high-level-design.md": ["Scalability(HLD).docx"],
    "why-use-buffered-channels-go.md": ["Why Use a Buffered Channel.docx"]
}

for md_file, docx_files in mappings.items():
    md_path = os.path.join(blog_dir, md_file)
    docx_paths = [os.path.join(docx_dir, df) for df in docx_files]
    process_blog_file(md_path, docx_paths)
