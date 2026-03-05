<script>
  import ShaderAnimation from "./components/ui/ShaderAnimation.svelte";
</script>

<div
  class="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-black text-white selection:bg-white/30"
>
  <div class="absolute inset-0 z-0 opacity-60">
    <ShaderAnimation />
  </div>

  <main
    class="relative z-10 flex flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8"
  >
    <h1
      class="mb-6 max-w-4xl text-5xl font-bold tracking-tighter text-white sm:text-7xl"
      style="text-wrap: balance;"
    >
      Chatwarp API
    </h1>

    <p
      class="mb-10 max-w-2xl text-lg text-white/70 sm:text-xl"
      style="text-wrap: balance;"
    >
      Fast, reliable, and secure.
    </p>

    <div class="flex flex-col gap-4 sm:flex-row">
      <button
        class="inline-flex h-12 flex-shrink-0 items-center justify-center rounded-full bg-white px-8 text-base font-medium text-black transition-transform hover:scale-105 hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-95"
      >
        Get Started
      </button>
      <button
        class="inline-flex h-12 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 text-base font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        View Documentation
      </button>
    </div>
  </main>
</div>
