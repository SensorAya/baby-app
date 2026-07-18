{
  description = "SensorAya Baby Expo and Android development shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, ... }:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
    in
    {
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };

          # The SDK itself is installed and updated by IntelliJ IDEA. These
          # libraries only make its prebuilt Linux tools work on NixOS.
          androidRuntimeLibraries = with pkgs; [
            alsa-lib
            dbus
            expat
            fontconfig
            freetype
            glib
            gtk3
            libGL
            libbsd
            libdrm
            libpng
            libpulseaudio
            libuuid
            libxkbcommon
            nspr
            nss
            stdenv.cc.cc.lib
            libx11
            libxcomposite
            libxcursor
            libxdamage
            libxext
            libxfixes
            libxi
            libxrandr
            libxrender
            libxtst
            libxcb
            libxkbfile
            zlib
          ];

          babyEmulator = pkgs.writeShellApplication {
            name = "baby-emulator";
            runtimeInputs = [ pkgs.coreutils ];
            text = ''
              android_home="''${ANDROID_HOME:-$HOME/Android/Sdk}"
              avd_name="''${ANDROID_AVD_NAME:-SensorAya_API_36}"
              emulator="$android_home/emulator/emulator"

              if [[ ! -x "$emulator" ]]; then
                echo "Android emulator not found at $emulator" >&2
                echo "Install it with IntelliJ IDEA's Android SDK Manager first." >&2
                exit 1
              fi

              exec "$emulator" "@$avd_name" "$@"
            '';
          };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              babyEmulator
              cmake
              git
              jdk21
              ninja
              nodejs_22
              pkg-config
              python3
              unzip
              watchman
            ];

            JAVA_HOME = pkgs.jdk21.home;
            LD_LIBRARY_PATH = nixpkgs.lib.makeLibraryPath androidRuntimeLibraries;
            NIX_LD_LIBRARY_PATH = nixpkgs.lib.makeLibraryPath androidRuntimeLibraries;

            shellHook = ''
              export ANDROID_HOME="''${ANDROID_HOME:-$HOME/Android/Sdk}"
              export ANDROID_SDK_ROOT="$ANDROID_HOME"
              export ANDROID_NDK_ROOT="''${ANDROID_NDK_ROOT:-$ANDROID_HOME/ndk/27.1.12297006}"
              export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"

              echo "SensorAya Baby development shell"
              echo "  Node    $(node --version)"
              echo "  Java    $(java -version 2>&1 | head -n 1)"
              echo "  Android $ANDROID_HOME"

              if [[ ! -d "$ANDROID_HOME" ]]; then
                echo "  Warning: Android SDK is missing; install it with IntelliJ IDEA's SDK Manager."
              fi
            '';
          };
        });
    };
}
