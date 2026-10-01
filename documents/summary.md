# Summary

This page provides an introduction to internals of the Mystic GME plugin.

The plugin is for Obsidian so see the Obsidian plugin document.

The "MGME book" is Pigeon, Tana, *Mythic Game Master Emulator Second Edition*. 2025, Word Mill Games, Riverside.

## Data blocks

The data is stored in Markdown "code blocks" with `mythic-` language codes. Obsidian has support for collecting these blocks as 'metadata' so they can be scanned by plugins. 

The content of the "code" blocks for Mythic is stored as JSON, which the plugin decodes to TypeScript class objects.

The plugin processes these blocks:

* displays Modal dialogs to allow the player to create blocks.
* reads existing blocks and uses the same Modals to allow the player to edit the blocks.
* converts the blocks to HTML and displays them in Reading mode.

### Block types

The block types are:

| Block type  | Use                             | In book   | Comments                                           |
| ----------- | ------------------------------- | --------- | -------------------------------------------------- |
| Adventure   | top level                       | *no*      |                                                    |
| Dice        | dice thrower, e.g. for `2d6+d4` | *no*      | can be used with other rule sets                   |
| Event focus | event focus                     | pp 36ff   | not a stand-alone block/Modal                      |
| Fate data   | fate questions                  | pp 17-33  |                                                    |
| Meaning     | meaning                         | pp 46ff   | may be stand-alone, or part of a question or scene |
| Object      | anything that can go on a list  | pp 44ff   | also used for oracle responses and simple text     |
| Question    | fate question                   | pp 17-33  | can contain event focus, fate data or meaning      |
| Scene       | scene in the story              | pp 59-120 | can contain event focus, fate data or meaning      |

### An example of a block

This is an example of a "code" block used to store Mythic data.

	```mythic-scene
	{"ident":"0","chaos":5,"sceneType":"altered","kind":"next","expected":"Many things","alteration":"A bit different"}
	```
This is a typical block.

	```mythic-scene
This is the header line. The block 'pretends' to be code of type `mythic-scene`. In fact, it is data of this kind (this is common in Obsidian plugins).

	{"ident":"0","chaos":5,"sceneType":"altered","kind":"next","expected":"Many things","alteration":"A bit different"}
This is the data about the scene in JSON format.

	```			
This is the footer (ends the block).
