import os

def create_svg_cover(title, filename):
    # Select gradient colors based on filename hash to give distinct premium looks
    colors = [
        ("from-indigo-600 to-purple-800", "#6366f1", "#4f46e5", "#3b82f6"),
        ("from-blue-600 to-indigo-900", "#3b82f6", "#1d4ed8", "#6366f1"),
        ("from-purple-600 to-pink-800", "#9333ea", "#a855f7", "#ec4899"),
        ("from-emerald-600 to-teal-900", "#10b981", "#059669", "#06b6d4"),
        ("from-rose-600 to-indigo-900", "#f43f5e", "#e11d48", "#4f46e5"),
        ("from-cyan-600 to-blue-800", "#06b6d4", "#0891b2", "#3b82f6"),
        ("from-violet-600 to-fuchsia-900", "#7c3aed", "#6d28d9", "#d946ef"),
        ("from-amber-600 to-rose-900", "#d97706", "#b45309", "#f43f5e"),
    ]
    
    idx = sum(ord(c) for c in filename) % len(colors)
    grad_class, c1, c2, c3 = colors[idx]
    
    svg = f"""<svg width="800" height="420" viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad-{idx}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}" />
      <stop offset="50%" stop-color="{c2}" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#6366f1" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0" />
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1" />
    </pattern>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="420" fill="url(#bgGrad-{idx})" />
  
  <!-- Grid overlay -->
  <rect width="800" height="420" fill="url(#grid)" />
  
  <!-- Abstract Shapes -->
  <circle cx="700" cy="100" r="250" fill="none" stroke="{c3}" stroke-width="2" stroke-opacity="0.2" stroke-dasharray="10 15" />
  <circle cx="700" cy="100" r="180" fill="none" stroke="{c1}" stroke-width="1" stroke-opacity="0.3" />
  <circle cx="100" cy="350" r="120" fill="none" stroke="{c3}" stroke-width="3" stroke-opacity="0.1" />
  
  <!-- Decorative code/dots -->
  <g fill="rgba(255, 255, 255, 0.15)" font-family="monospace" font-size="12">
    <text x="50" y="60">&lt;service/&gt;</text>
    <text x="50" y="80">import "github.com/golang"</text>
    <text x="50" y="100">conn, err := net.Dial("tcp", "0.0.0.0:8080")</text>
    
    <text x="620" y="320">// scale cluster</text>
    <text x="620" y="340">replicaCount: 3</text>
    <text x="620" y="360">status: Ready</text>
  </g>
  
  <!-- Glow behind text -->
  <circle cx="400" cy="210" r="150" fill="{c1}" filter="blur(60px)" opacity="0.15" />
  
  <!-- Content Card -->
  <rect x="80" y="100" width="640" height="220" rx="24" fill="rgba(15, 23, 42, 0.4)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" style="backdrop-filter: blur(12px);" />
  
  <!-- Badge -->
  <rect x="110" y="130" width="100" height="24" rx="12" fill="rgba(99, 102, 241, 0.2)" stroke="rgba(99, 102, 241, 0.4)" stroke-width="1" />
  <text x="160" y="146" fill="#e0e7ff" font-family="'Inter', sans-serif" font-size="10" font-weight="bold" text-anchor="middle" letter-spacing="1">TECHNICAL</text>
  
  <!-- Title text (handles wrap for long titles) -->
"""
    
    # Handle text wrapping for title
    words = title.split()
    lines = []
    current_line = []
    for w in words:
        if len(" ".join(current_line + [w])) > 32:
            lines.append(" ".join(current_line))
            current_line = [w]
        else:
            current_line.append(w)
    if current_line:
        lines.append(" ".join(current_line))
        
    start_y = 205 - (len(lines) - 1) * 20
    for i, line in enumerate(lines):
        svg += f'  <text x="110" y="{start_y + i * 36}" fill="#ffffff" font-family="\'Outfit\', \'Inter\', sans-serif" font-size="28" font-weight="800" letter-spacing="-0.5">{line}</text>\n'
        
    svg += """
  <!-- Footer decor -->
  <line x1="110" y1="280" x2="300" y2="280" stroke="#6366f1" stroke-width="3" stroke-linecap="round" />
  <circle cx="315" cy="280" r="3" fill="#ec4899" />
  <circle cx="325" cy="280" r="3" fill="#ec4899" opacity="0.5" />
</svg>
"""
    return svg

def main():
    blog_dir = r"c:\Users\Tanmoy95\Desktop\pROTFOLIO\src\content\blog"
    assets_dir = r"c:\Users\Tanmoy95\Desktop\pROTFOLIO\public\blog-assets"
    
    os.makedirs(assets_dir, exist_ok=True)
    
    blogs = [
        ("building-high-concurrency-dag-engine", "High-Concurrency DAG Execution Engine"),
        ("caching-high-level-design", "Caching High-Level Design & Strategies"),
        ("dag-execution-engines-orchestration", "DAG Execution Engines & Orchestration"),
        ("dependency-inversion-principle-golang", "Dependency Inversion Principle in Go"),
        ("event-driven-architecture-hld", "Event-Driven Architecture HLD"),
        ("kubernetes-core-architecture-notes", "Kubernetes Core Architecture Notes"),
        ("liskov-substitution-principle-golang", "Liskov Substitution Principle in Go"),
        ("oop-in-go-low-level-design", "OOP in Go: Low-Level Design"),
        ("scalability-high-level-design", "Scalability High-Level Design Guide"),
        ("why-use-buffered-channels-go", "Why Use a Buffered Channel in Go")
    ]
    
    for filename, title in blogs:
        # Create SVG cover
        svg_content = create_svg_cover(title, filename)
        svg_path = os.path.join(assets_dir, f"{filename}.svg")
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        print(f"Generated {filename}.svg")
        
        # Update markdown file to reference the .svg image instead of .jpg/.png for the cover
        md_path = os.path.join(blog_dir, f"{filename}.md")
        if os.path.exists(md_path):
            with open(md_path, "r", encoding="utf-8") as f:
                content = f.read()
            # Replace cover image reference
            content = re.sub(
                r'image:\s*"/blog-assets/[^"]+"',
                f'image: "/blog-assets/{filename}.svg"',
                content
            )
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated {filename}.md cover reference to .svg")

if __name__ == "__main__":
    import re
    main()
