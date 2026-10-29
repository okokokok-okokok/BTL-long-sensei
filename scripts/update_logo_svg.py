import base64

with open('public/logo.png', 'rb') as f:
    b64 = base64.b64encode(f.read()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 762" width="100%" height="100%">
  <image href="data:image/png;base64,{b64}" x="0" y="0" width="600" height="762" />
</svg>'''

with open('public/logo.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("Updated public/logo.svg successfully!")
