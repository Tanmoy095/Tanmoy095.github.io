import os
import zipfile
import re

def main():
    docx_dir = r"c:\Users\Tanmoy95\Desktop\pROTFOLIO\My-Info and requirement\blogs i write"
    blog_dir = r"c:\Users\Tanmoy95\Desktop\pROTFOLIO\src\content\blog"
    assets_dir = r"c:\Users\Tanmoy95\Desktop\pROTFOLIO\public\blog-assets"
    
    os.makedirs(assets_dir, exist_ok=True)
    
    # 1. Extract DAG.docx image
    dag_docx = os.path.join(docx_dir, "DAG.docx")
    if os.path.exists(dag_docx):
        with zipfile.ZipFile(dag_docx) as z:
            try:
                img_data = z.read("word/media/image1.png")
                dest = os.path.join(assets_dir, "building-high-concurrency-dag-engine.png")
                with open(dest, "wb") as f:
                    f.write(img_data)
                print("Extracted building-high-concurrency-dag-engine.png")
            except KeyError:
                print("image1.png not found in DAG.docx")
    
    # 2. Extract Caching HLD.docx images
    caching_docx = os.path.join(docx_dir, "Caching HLD.docx")
    if os.path.exists(caching_docx):
        with zipfile.ZipFile(caching_docx) as z:
            try:
                img1_data = z.read("word/media/image1.png")
                dest1 = os.path.join(assets_dir, "caching-high-level-design-1.png")
                with open(dest1, "wb") as f:
                    f.write(img1_data)
                print("Extracted caching-high-level-design-1.png")
            except KeyError:
                print("image1.png not found in Caching HLD.docx")
                
            try:
                img2_data = z.read("word/media/image2.png")
                dest2 = os.path.join(assets_dir, "caching-high-level-design-2.png")
                with open(dest2, "wb") as f:
                    f.write(img2_data)
                print("Extracted caching-high-level-design-2.png")
            except KeyError:
                print("image2.png not found in Caching HLD.docx")

    # 3. Update building-high-concurrency-dag-engine.md frontmatter image extension to .png
    dag_md = os.path.join(blog_dir, "building-high-concurrency-dag-engine.md")
    if os.path.exists(dag_md):
        with open(dag_md, "r", encoding="utf-8") as f:
            content = f.read()
        content = content.replace('image: "/blog-assets/building-high-concurrency-dag-engine.jpg"', 'image: "/blog-assets/building-high-concurrency-dag-engine.png"')
        with open(dag_md, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated building-high-concurrency-dag-engine.md")
        
    # 4. Update caching-high-level-design.md
    caching_md = os.path.join(blog_dir, "caching-high-level-design.md")
    if os.path.exists(caching_md):
        with open(caching_md, "r", encoding="utf-8") as f:
            content = f.read()
            
        content = content.replace('image: "/blog-assets/caching-high-level-design.jpg"', 'image: "/blog-assets/caching-high-level-design-1.png"')
        
        # Check if they are already in the content
        if "caching-high-level-design-1.png" not in content:
            # Insert image 1 before ## External caching
            content = content.replace('## External caching', '![External Caching](/blog-assets/caching-high-level-design-1.png)\n\n## External caching')
            
        if "caching-high-level-design-2.png" not in content:
            # Insert image 2 before ## In-process caching
            content = content.replace('## In-process caching', '![In-Process Caching](/blog-assets/caching-high-level-design-2.png)\n\n## In-process caching')
            
        with open(caching_md, "w", encoding="utf-8") as f:
            f.write(content)
        print("Updated caching-high-level-design.md")

if __name__ == "__main__":
    main()
