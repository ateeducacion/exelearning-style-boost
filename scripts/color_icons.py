#!/usr/bin/env python3
"""Colour the iDevice icons by Moodle activity purpose.

Copies the Material Symbols SVG icons of eXeLearning's Zen style and swaps
their single colour for the matching $activity-icon-colors value of Moodle's
Boost theme (theme/boost/scss/moodle/variables.scss).

    python3 scripts/color_icons.py /path/to/exelearning/public/files/perm/themes/base/zen/icons
"""
from pathlib import Path
import shutil
import sys

SOURCE_COLOUR = "#d40055"
CONTENT = "#0099ad"
PURPOSES = {
    "#f90086": "ask think think_alt reflection calculate competencies",  # assessment
    "#5b40ff": "collaborative agreement perform present",  # collaboration
    "#eb6200": "alert discuss listen share",  # communication
    "#8d3d1b": "interactive pieces piece play draw experiment sport activity start chrono",  # interactive content
    "#da58ef": "case suitcase passport roadmap stop",  # administration
}
colour_of = {name: colour for colour, names in PURPOSES.items() for name in names.split()}

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / "theme/icons"
for icon in sorted(source.glob("*.svg")):
    svg = icon.read_text()
    assert SOURCE_COLOUR in svg, f"{icon.name} does not use {SOURCE_COLOUR}"
    (target / icon.name).write_text(svg.replace(SOURCE_COLOUR, colour_of.get(icon.stem, CONTENT)))
shutil.copy2(source / "LICENSE.txt", target / "LICENSE.txt")
missing = set(colour_of) - {icon.stem for icon in source.glob("*.svg")}
assert not missing, f"Unknown icons in PURPOSES: {sorted(missing)}"
print(f"Coloured {len(list(source.glob('*.svg')))} icons into {target}")
