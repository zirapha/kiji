kiji
====
Kiji is editor of report templates (for example birth certificate). It is a
simple webpage where you can put text labels, lines, rectangles and 
placeholder texts. Created report template then must be filled with data on 
server side, where placeholder texts are replaced with data and saved into 
PDF which can be send back to client.

Kiji uses HTML5 canvas for rendering, JSON and local storage to save reports.
Kiji itself focus only on editing, so there is no saving, loading, printing 
support. You would write your own anyway. Simple PHP demo how to use data 
from HTML form and then create PDF is/(will be) included.

Purpose of Kiji is to allow users of you IS to modify reports to some extent 
(e.g. moving labels here and there, changing color or thicknes of elements, 
removing unwanted texts, adding logos, etc.) without your (programmer) 
intervention.

Kiji had several predecessors, and all of them was terrible to use, so this 
time, I'll do my best to make it as simple and as much user friendly as 
possible.

Goals
-----
- Ergonomy. No matter how many features you add to wysiwyg editor, when core
editing functionality is hard to use, no new features will change that. 
I want Kiji to be simple and intuitive to use for new users.
- Simplicity. Focus on just editing. Nothing else. No saving, no user ACL, no
PDF generation.

History
-------
- 2012/06/15 - First working demo (lines, texts, basic editing)
- 2012/05/24 - Development started

Todo
----
- When resizing text using shift+arrows, text width is not updated
- Moving objects with plain arrows was temporarily disabled to prevent moving
  object when focus is in input and I press arrows to move cursor within input.
  Reason for this interference is because input never really loose focus because
  canvas cannot gain focus.
