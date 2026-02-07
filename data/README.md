# Portfolio Data

This directory contains JSON files that control the content displayed on the portfolio website. Edit these files to update your portfolio without touching any code.

## Files Overview

### `projects.json`
Contains all featured projects displayed on the homepage.

**Structure:**
```json
{
  "projects": [
    {
      "id": "unique-project-id",
      "title": "Project Name",
      "description": "Project description in Korean or English",
      "image": "path/to/image.png",  // Leave empty "" for placeholder
      "tags": ["Tag1", "Tag2", "Tag3"],
      "github": "https://github.com/username/repo",
      "link": "projects/project-detail.html"
    }
  ]
}
```

**How to add a new project:**
1. Copy an existing project object
2. Update all fields with your new project info
3. Save the file
4. Refresh the browser - changes appear instantly!

---

### `about.json`
Controls the About section content.

**Structure:**
```json
{
  "intro": [
    "First paragraph of introduction...",
    "Second paragraph..."
  ],
  "highlights": [
    {
      "number": "3M+",
      "label": "Users Served"
    }
  ],
  "expertise": [
    {
      "title": "Area Title",
      "description": "Detailed description..."
    }
  ]
}
```

**How to edit:**
- **intro**: Array of paragraphs - add or edit text
- **highlights**: Numeric achievements (e.g., "3M+ Users", "4+ Projects")
- **expertise**: Your main skill areas with descriptions

---

### `skills.json`
Controls the tech stack badges in the hero section.

**Structure:**
```json
{
  "categories": [
    {
      "name": "Category Name",
      "skills": [
        {
          "name": "Skill Name",
          "color": "#HexColor",
          "textColor": "#HexColor"  // Optional, for light backgrounds
        }
      ]
    }
  ]
}
```

**How to add skills:**
1. Find the appropriate category (Languages, Backend, Infrastructure)
2. Add a new skill object with name and color
3. Use `textColor` for light background colors (e.g., yellow)

**Common Colors:**
- Java: `#ED8B00`
- JavaScript: `#F7DF1E` (textColor: `#000`)
- TypeScript: `#3178C6`
- Python: `#3776AB`
- Spring: `#6DB33F`
- NestJS: `#E0234E`
- Docker: `#2496ED`
- Kafka: `#231F20`

---

## Quick Tips

1. **No code changes needed** - Just edit JSON files
2. **Changes are instant** - Refresh browser to see updates
3. **JSON syntax matters** - Use a JSON validator if unsure
4. **Images optional** - Leave `image: ""` for placeholder SVG
5. **Validation** - Run `python3 -m json.tool filename.json` to validate

## Testing Changes

After editing, validate your JSON:

```bash
# Validate all JSON files
python3 -m json.tool data/projects.json > /dev/null
python3 -m json.tool data/about.json > /dev/null
python3 -m json.tool data/skills.json > /dev/null
```

If no errors, your changes are valid!
