Create a simple BIM fragment viewer using That Open Engine components.
The viewer should:
1. Load a fragment (use a sample fragment file or create a simple geometric fragment programmatically).
2. Display it in a 3D scene with proper lighting and shadows.
3. Allow basic camera navigation (orbit, pan, zoom).
4. Use TOE components only (no raw Three.js imports, no manual geometry creation).
5. Output the code as a single TypeScript file with inline comments.

Ensure you follow the TOE API Resolution Hierarchy:
1. That Open Engine components (@thatopen/components, @thatopen/ui-components)
2. Three.js via TOE wrappers (OBC.Worlds, OBC.FragmentsManager, etc.)
3. Raw Three.js only when no TOE alternative exists (rare).

## Reference Examples

The following snippets from the That Open Engine corpus are relevant to your task. Use them as reference for TOE patterns:

### FragmentsManager (highest)
*Source:* core/FragmentsManager.example.ts  
*Package:* core  
```ts
// ...
  ## 📄 Managing Fragments Models
  ---
  In this tutorial, you'll learn how to load your BIM models in Fragment format. Fragment is an [open source geometry system](https://github.com/ThatOpen/engine_fragment/) that we created on top of [Three.js](https://threejs.org/) to display BIM models fast, while keeping control over the individual items of the model. The idea is simple: a BIM model is a FragmentsGroup, which is (like the name implies) a collection of fragments. A fragment is a set of identical geometries instantiated around the scene.

  :::tip How do I get a BIM model in Fragment format?

  The IfcLoader component does exactly that! It converts IFC models to Fragments. Check out that tutorial if you are starting out with IFC files. Of course, you can just use the IfcLoader in your app, but loading fragments is more than x10 faster than loading IFC files. Our recommendation is to convert your IFC files to fragments just once, store the fragment somewhere (frontent of backend) and then load the fragments instead of teh IFC models directly.

  :::

```

### IfcLoader (highest)
*Source:* core/IfcLoader.example.ts  
*Package:* core  
```ts
// ...
  ## 📄 Loading IFC Models
  ---
  IFC is the most common format to share BIM data openly. Our libraries are able to load, navigate and even create and edit them directly. In this tutorial, you'll learn how to open an IFC model in the 3D scene.

  :::tip IFC?

  If you are not famliar with the construction industry, this might be the first time you come across this term. It stands for Industry Foundation Classes, and it's the most widespread standard for sharing BIM data freely, without depending on specific software manufacturers and their propietary formats.

  :::

```

### ShadowedScene (highest)
*Source:* core/ShadowedScene.example.ts  
*Package:* core  
```ts
// ...
### 🚀 Handling BIM models like a boss
---

In this tutorial, you'll learn how to load your BIM models in Fragment format. Fragment is an [open source geometry system](https://github.com/ThatOpen/engine_fragment/) that we created on top of [Three.js](https://threejs.org/) to display BIM models fast, while keeping control over the individual items of the model. The idea is simple: a BIM model is a FragmentsGroup, which is (like the name implies) a collection of fragments. A fragment is a set of identical geometries instantiated around the scene.

:::tip How do I get a BIM model in Fragment format?

The IfcLoader component does exactly that! It converts IFC models to Fragments. Check out that tutorial if you are starting out with IFC files. Of course, you can just use the IfcLoader in your app, but loading fragments is more than x10 faster than loading IFC files. Our recommendation is to convert your IFC files to fragments just once, store the fragment somewhere (frontent of backend) and then load the fragments instead of teh IFC models directly.

:::
```

### Worlds (highest)
*Source:* core/Worlds.example.ts  
*Package:* core  
```ts
// ...
In this tutorial you'll learn how to create a simple scene using `@thatopen/components`.

:::tip Hello world!

A world represents a 3D environment in your application. It consists of a scene, a camera and (optionally) a renderer. You can create multiple worlds and show them in multiple viewports at the same time.

:::

In this tutorial, we will import:

```

### BCFTopics (highest)
*Source:* core/BCFTopics.example.ts  
*Package:* core  
```ts
// ...
  ## 👌 Communicating The Right Way
  ---
  Effective communication is essential for all projects, whether in construction or other industries. It is crucial to have a reliable method for project members to communicate and track discussions. In construction projects, BuildingSMART introduced the BIM Collaboration Format (BCF) to standardize communication about ongoing topics among stakeholders. That Open Engine includes integration with BCF, enabling you to read, create, and update any BCF file seamlessly. Let's explore how it works!

  ### 🖖 Importing our Libraries
  First things first, let's install all necessary dependencies to make this example work:
*/

import Stats from "stats.js";
import * as BUI from "@thatopen/ui";
```


