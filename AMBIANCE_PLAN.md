# Ambiance App Development Plan

## Overview
Ambiance is an immersive atmosphere generator that creates custom soundscapes and matching visuals based on user requests. The app uses AI to interpret natural language requests and orchestrate both audio mixing and visual generation in real-time.

## Architecture Components

### 1. Frontend (Vite + React)
- **Build Tool**: Vite with HMR
- **UI Framework**: React 19 with TypeScript
- **Routing**: TanStack Router (file-based)
- **Styling**: Tailwind CSS v4 + cva
- **Components**: Radix UI (already configured)
- **3D Graphics**: React Three Fiber for WebGL visuals
- **Audio**: Tone.js + Web Audio API
- **State Management**: TanStack Query (already set up)
- **Real-time Communication**: tRPC subscriptions or WebSockets

### 2. Backend (Bun + Hono)
- **Runtime**: Bun for fast performance
- **Framework**: Hono with tRPC adapter
- **API**: tRPC for type-safe endpoints
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: better-auth (already configured)
- **AI Integration**: OpenRouter for ChatGPT access
- **File Storage**: Local public folder or S3

### 3. AI Integration (OpenRouter + ChatGPT)
- **LLM**: GPT-4 with function calling via OpenRouter
- **Tools**: tRPC procedures called by AI
- **Context**: User auth from better-auth

## Sound System Architecture

### Sound Sources
1. **Freesound.org API**
   - Free, community-driven sound library
   - RESTful API with search capabilities
   - Requires API key (free tier available)
   
2. **Local Sound Library**
   - Stored in `apps/web/public/sounds/`
   - Categorized by type (nature, urban, abstract)
   - Pre-processed for seamless looping

3. **Procedural Audio**
   - Tone.js for synthesized sounds
   - Web Audio API for filters and effects
   - Real-time parameter modulation

### Sound Mixing Approach

#### Client-Side Implementation with Tone.js
```javascript
// Using Tone.js in React components
class SoundMixer {
  - Layer management (up to 6 concurrent sounds)
  - Volume automation with Tone.Volume
  - Crossfading with Tone.CrossFade
  - Effects chain (Tone.Reverb, Tone.Delay, Tone.Filter)
  - Spatial audio with Tone.Panner3D
}
```

### Audio Loading Strategy
1. **Lazy Loading**
   - Load sounds on demand
   - Cache with TanStack Query
   - Preload predicted sounds
   
2. **Progressive Enhancement**
   - Start with low quality
   - Upgrade when bandwidth allows
   - Use service workers for offline

## Visual System Architecture

### React Three Fiber Components
1. **Environment System**
   - Dynamic skyboxes with `@react-three/drei`
   - Procedural clouds
   - Weather effects (rain, snow, fog)
   
2. **Particle Systems**
   - Fireflies, dust, pollen
   - Rain/snow particles using instances
   - Abstract visual elements
   
3. **Shader Effects**
   - Custom GLSL shaders
   - Post-processing with EffectComposer
   - Real-time parameter animation

### Visual Parameters (TypeScript)
```typescript
interface VisualParameters {
  environment: 'forest' | 'ocean' | 'space' | 'urban' | 'abstract'
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night'
  weather: 'clear' | 'rain' | 'fog' | 'snow'
  colorPalette: string[]
  intensity: number
  particleDensity: number
}
```

## tRPC + AI Tool Integration

### Sound Control Procedures
```typescript
// apps/server/src/routers/sounds.ts
export const soundsRouter = router({
  setSoundscape: protectedProcedure
    .input(z.object({
      layers: z.array(z.object({
        sound: z.string(),
        volume: z.number().min(0).max(1),
        pan: z.number().min(-1).max(1),
        effects: z.object({
          reverb: z.number().optional(),
          lowpass: z.number().optional()
        })
      })),
      transition: z.enum(['fade', 'cut', 'crossfade']),
      duration: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      // Return configuration for frontend
      return { success: true, config: input }
    })
})
```

### AI Chat with Tool Calling
```typescript
// OpenRouter integration in tRPC
const tools = [
  {
    type: 'function',
    function: {
      name: 'setSoundscape',
      description: 'Configure the audio atmosphere',
      parameters: { /* JSON Schema */ }
    }
  },
  {
    type: 'function',
    function: {
      name: 'setVisualScene',
      description: 'Configure the visual atmosphere',
      parameters: { /* JSON Schema */ }
    }
  }
]
```

## Implementation Phases

### Phase 1: Foundation (Days 1-3)
- Add Tone.js and React Three Fiber to existing Vite app
- Create database schema with Drizzle
- Set up basic tRPC routers
- Test with existing UI components

### Phase 2: Sound System (Days 4-7)
- Implement Tone.js mixer component
- Create sound library in public folder
- Build tRPC endpoints for sound control
- Integrate with existing TanStack Query

### Phase 3: AI Integration (Days 8-10)
- Add OpenRouter to Hono backend
- Create tRPC chat procedure with tools
- Connect to existing better-auth
- Test AI-driven sound mixing

### Phase 4: Visual System (Days 11-14)
- Build React Three Fiber scene
- Create weather effects components
- Implement visual parameter controls
- Sync with sound system

### Phase 5: Polish (Days 15-17)
- User preferences with better-auth
- Save/load soundscapes to PostgreSQL
- Performance optimization
- Error handling with Sonner toasts

## Technical Stack (Your Actual Setup)

### Frontend
- **Vite** - Fast build tool with HMR
- **React 19** - Latest React features
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management
- **Radix UI** - Accessible components
- **Tailwind v4** - Utility-first CSS
- **cva** - Component variants
- **Sonner** - Toast notifications

### Backend
- **Bun** - Fast JavaScript runtime
- **Hono** - Lightweight web framework
- **tRPC** - End-to-end typesafe APIs
- **Drizzle** - TypeScript ORM
- **PostgreSQL** - Relational database
- **better-auth** - Authentication

### New Additions (Audio/Visual Only)
- **Tone.js** - Web audio framework
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **OpenAI SDK** - For OpenRouter integration

## Example User Flow
1. User: "I want a rainy forest at night with fireflies"
2. tRPC mutation to AI chat endpoint
3. OpenRouter/ChatGPT processes with tools
4. AI calls tRPC procedures:
   - `setSoundscape` with rain + forest layers
   - `setVisualScene` with night forest + rain
5. Frontend receives via TanStack Query
6. Tone.js mixer starts sounds
7. React Three Fiber renders scene
8. Continuous playback with smooth transitions

## Performance Optimizations

### Audio
- Use Web Workers for audio processing
- Implement audio sprite sheets
- Cache with TanStack Query
- Lazy load uncommon sounds

### Visuals
- Use instanced meshes for particles
- LOD (Level of Detail) for complex scenes
- Frustum culling
- GPU-based animations

### General
- Code splitting with Vite
- React.lazy for route components
- Service worker for offline support
- CDN for static assets

## Next Steps
1. Install Tone.js and React Three Fiber
2. Create Drizzle schema for sounds
3. Build simple audio test component
4. Add OpenRouter to backend
5. Create chat interface with existing components 