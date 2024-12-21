
const markdownInput = document.getElementById('markdown-input');
const mindmap = document.getElementById('mindmap');
const exportButton = document.getElementById('export-png');

// Parse Markdown and Generate Mind Map
function updateContent() {
  const markdownText = markdownInput.value;
  const parsedHTML = marked.parse(markdownText);

  // Extract Headings and Create Hierarchical Data
  const parser = new DOMParser();
  const doc = parser.parseFromString(parsedHTML, 'text/html');
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, ul, li');

  const hierarchy = buildHierarchy(headings);
  generateMindMap(hierarchy);
}

// Build a Hierarchical Data Structure for Mind Map
function buildHierarchy(elements) {
  const root = { name: "Document", children: [] };
  const stack = [{ node: root, level: 0 }];

  elements.forEach((el) => {
    const level = el.tagName.startsWith('H') ? parseInt(el.tagName.substring(1)) : null;
    const content = el.innerHTML
      .replace(/<[^>]+>/g, '') // Strip HTML tags
      .trim();
    const node = { name: content, children: [] };

    if (level) {
      while (stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      stack[stack.length - 1].node.children.push(node);
      stack.push({ node, level });
    } else if (el.tagName === 'LI') {
      stack[stack.length - 1].node.children.push(node);
    }
  });

  return root;
}

// Generate Mind Map Using D3.js
function generateMindMap(data) {
  // Clear existing content
  mindmap.innerHTML = '';

  const width = mindmap.offsetWidth;
  const height = mindmap.offsetHeight;

  const svg = d3.select(mindmap)
    .append('svg')
    .attr('id', 'mindmap-svg')
    .attr('width', width)
    .attr('height', height)
    .call(
      d3.zoom().on('zoom', (event) => {
        g.attr('transform', event.transform);
      })
    )
    .append('g');

  const g = svg.append('g');

  const tree = d3.tree().size([height, width - 200]);
  const root = d3.hierarchy(data);

  // Generate Nodes and Links
  const nodes = tree(root).descendants();
  const links = tree(root).links();

  // Adjust tree layout for visibility
  tree.size([height, Math.max(200, nodes.length * 50)]);

  // Draw Links
  g.selectAll('.link')
    .data(links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkHorizontal().x((d) => d.y).y((d) => d.x))
    .style('stroke', (d) => (d.target.depth % 2 === 0 ? '#888' : '#ccc'))
    .style('stroke-width', 1.5);

  // Draw Nodes
  const node = g
    .selectAll('.node')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', (d) => `translate(${d.y},${d.x})`);

  node
    .append('circle')
    .attr('r', 6)
    .style('fill', (d) => {
      if (d.depth === 0) return '#000'; // Root node
      if (d.children) return '#69b3a2'; // Parent nodes
      return '#ffcccb'; // Leaf nodes
    });

  node
    .append('text')
    .attr('dy', 3)
    .attr('x', (d) => (d.children ? -10 : 10))
    .style('text-anchor', (d) => (d.children ? 'end' : 'start'))
    .style('font-weight', (d) => (d.depth === 1 ? 'bold' : 'normal'))
    .style('font-size', (d) => (d.depth === 0 ? '14px' : '12px'))
    .text((d) => d.data.name);
}

// Export SVG as PNG with a white background
function exportAsPNG() {
  const svgElement = document.getElementById('mindmap-svg');
  const serializer = new XMLSerializer();
  const svgData = serializer.serializeToString(svgElement);

  // Create a canvas
  const canvas = document.createElement('canvas');
  canvas.width = svgElement.clientWidth;
  canvas.height = svgElement.clientHeight;

  const ctx = canvas.getContext('2d');

  // Add a white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render the SVG onto the canvas
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    const pngData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'mindmap.png';
    link.href = pngData;
    link.click();
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
}

exportButton.addEventListener('click', exportAsPNG);

// Initialize with Sample Content
markdownInput.value = `# Mind Map Application
## Features
### Export Functionality
- Save the map as PNG.
### Node Styling
- Color-coded levels.
### Dynamic Layout
- Fits all nodes dynamically.`;
updateContent();

// Update mind map on input change
markdownInput.addEventListener('input', updateContent);
