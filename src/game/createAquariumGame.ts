import * as Phaser from "phaser";

import { buildAnimationSequence } from "@/game/animation/stateMachine";
import type {
  AnimationStep,
  AquariumGameController,
  AquariumGameOptions,
} from "@/game/types";

const paths = {
  background: "/assets/backgrounds/aquarium-far-background.png",
  ruins: "/assets/backgrounds/aquarium-midground-ruins.png",
  boxClosed: "/assets/props/prediction-box-closed.png",
  boxOpen: "/assets/props/prediction-box-open.png",
  burst: "/assets/effects/prediction-reveal-burst.png",
};

const mascotTextures = [
  "octopus-idle-front",
  "octopus-idle-alt",
  "octopus-inspect-left",
  "octopus-inspect-right",
  "octopus-thinking",
  "octopus-hesitate-center",
  "octopus-reconsider-turn",
  "octopus-draw-shrug",
  "octopus-swim-left",
  "octopus-swim-right",
  "octopus-select-left",
  "octopus-select-right",
  "octopus-celebrate",
];

const targetPositions = {
  team_a: { x: 360, y: 675 },
  team_b: { x: 920, y: 675 },
} as const;
const closedBoxPositionY = 748;
const openBoxPositionY = 728;
const openBoxOffsetX = 25;
const groundPositionY = 535;

function setClosedBoxOrientation(
  box: Phaser.GameObjects.Image,
  outcome: "team_a" | "team_b",
) {
  box.setFlipX(outcome === "team_a");
}

function setOpenBoxOrientation(
  box: Phaser.GameObjects.Image,
  outcome: "team_a" | "team_b",
) {
  // The open master was drawn from the opposite perspective to the closed one.
  box.setFlipX(outcome === "team_b");
}

function chosenPosition(outcome: AquariumGameOptions["outcome"]) {
  if (outcome === "team_a") return { x: 555, y: groundPositionY };
  if (outcome === "team_b") return { x: 725, y: groundPositionY };
  return { x: 640, y: groundPositionY };
}

class AquariumScene extends Phaser.Scene {
  private activeRun = 0;
  private burst?: Phaser.GameObjects.Image;
  private octopus?: Phaser.GameObjects.Image;
  private outcomeLabel?: Phaser.GameObjects.Text;
  private teamABox?: Phaser.GameObjects.Image;
  private teamBBox?: Phaser.GameObjects.Image;
  private targetPlates = new Map<
    "team_a" | "team_b",
    Phaser.GameObjects.Container
  >();

  constructor(private readonly options: AquariumGameOptions) {
    super("aquarium");
  }

  preload() {
    this.load.image("background", paths.background);
    this.load.image("ruins", paths.ruins);
    this.load.image("box-closed", paths.boxClosed);
    this.load.image("box-open", paths.boxOpen);
    this.load.image("burst", paths.burst);
    if (this.options.teamAFlagAssetUrl)
      this.load.image("team-a-flag", this.options.teamAFlagAssetUrl);
    if (this.options.teamBFlagAssetUrl)
      this.load.image("team-b-flag", this.options.teamBFlagAssetUrl);
    for (const texture of mascotTextures) {
      this.load.image(texture, `/assets/mascot/${texture}.png`);
    }
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      if (file.key === "team-a-flag" || file.key === "team-b-flag") return;
      this.options.onError(`Animation asset failed to load: ${file.key}`);
    });
  }

  create() {
    this.add.image(640, 360, "background").setDisplaySize(1280, 720);
    this.add.image(640, 360, "ruins").setDisplaySize(1280, 720);

    this.teamABox = this.add
      .image(targetPositions.team_a.x, closedBoxPositionY, "box-closed")
      .setOrigin(0.5, 1)
      .setDisplaySize(315, 315);
    setClosedBoxOrientation(this.teamABox, "team_a");
    this.teamBBox = this.add
      .image(targetPositions.team_b.x, closedBoxPositionY, "box-closed")
      .setOrigin(0.5, 1)
      .setDisplaySize(315, 315);
    setClosedBoxOrientation(this.teamBBox, "team_b");

    this.createMatchupScoreboard();
    this.outcomeLabel = this.add
      .text(640, 160, this.outcomeLabelText(), {
        align: "center",
        color: "#ffffff",
        fontFamily: "Arial",
        fontSize: "38px",
        fontStyle: "bold",
        stroke: "#03111e",
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.burst = this.add
      .image(640, 520, "burst")
      .setDisplaySize(220, 220)
      .setAlpha(0);
    this.octopus = this.add
      .image(640, groundPositionY, "octopus-idle-front")
      .setDisplaySize(300, 300);

    this.options.onStateChange("idle");
    this.options.onReady();
  }

  startSequence() {
    const run = ++this.activeRun;
    this.resetVisuals();
    const steps = buildAnimationSequence(
      this.options.outcome,
      this.options.animationSeed,
    );

    if (this.options.reducedMotion) {
      this.finish(run);
      return;
    }

    void this.playSteps(steps, run);
  }

  skipSequence() {
    const run = ++this.activeRun;
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.finish(run);
  }

  private async playSteps(steps: AnimationStep[], run: number) {
    for (const step of steps) {
      if (run !== this.activeRun) return;
      this.applyStep(step);
      if (step.duration > 0) {
        await new Promise<void>((resolve) => {
          this.time.delayedCall(step.duration, resolve);
        });
      }
    }
    if (run === this.activeRun) this.options.onComplete();
  }

  private applyStep(step: AnimationStep) {
    this.options.onStateChange(step.state);
    this.octopus?.setTexture(step.texture);
    this.applyOctopusSize(step.texture);

    this.clearTargetFocus();
    if (step.state === "inspect_team_a") {
      this.focusTarget("team_a");
      this.moveOctopus(555, groundPositionY, step.duration);
    }
    if (step.state === "inspect_team_b") {
      this.focusTarget("team_b");
      this.moveOctopus(725, groundPositionY, step.duration);
    }
    if (step.state === "inspect_draw" || step.state === "hesitate")
      this.moveOctopus(640, groundPositionY, step.duration);
    if (step.state === "inspect_draw") this.focusDraw();
    if (step.state === "choose") {
      const position = chosenPosition(this.options.outcome);
      this.focusOutcome();
      this.moveOctopus(position.x, position.y, step.duration);
    }
    if (step.state === "open_container") {
      this.focusOutcome();
      this.openChosenProp();
    }
    if (step.state === "eat") {
      this.focusOutcome();
      this.highlightChosenProp();
    }
    if (step.state === "celebrate" || step.state === "reveal") {
      this.outcomeLabel?.setAlpha(1);
      this.focusOutcome();
      const burstPosition = this.chosenBurstPosition();
      this.burst?.setPosition(burstPosition.x, burstPosition.y);
      this.burst?.setAlpha(0.9);
      const position = chosenPosition(this.options.outcome);
      this.moveOctopus(position.x, position.y, step.duration);
    }
  }

  private finish(run: number) {
    if (run !== this.activeRun) return;
    this.resetVisuals();
    const position = chosenPosition(this.options.outcome);
    this.options.onStateChange("complete");
    this.octopus
      ?.setTexture("octopus-celebrate")
      .setPosition(position.x, position.y);
    this.applyOctopusSize("octopus-celebrate");
    this.openChosenProp();
    this.highlightChosenProp();
    this.focusOutcome();
    this.outcomeLabel?.setAlpha(1);
    const burstPosition = this.chosenBurstPosition();
    this.burst?.setPosition(burstPosition.x, burstPosition.y).setAlpha(0.9);
    this.options.onComplete();
  }

  private resetVisuals() {
    this.tweens.killAll();
    this.time.removeAllEvents();
    this.teamABox
      ?.setTexture("box-closed")
      .setPosition(targetPositions.team_a.x, closedBoxPositionY)
      .setDisplaySize(315, 315)
      .clearTint()
      .setAlpha(1);
    if (this.teamABox) setClosedBoxOrientation(this.teamABox, "team_a");
    this.teamBBox
      ?.setTexture("box-closed")
      .setPosition(targetPositions.team_b.x, closedBoxPositionY)
      .setDisplaySize(315, 315)
      .clearTint()
      .setAlpha(1);
    if (this.teamBBox) setClosedBoxOrientation(this.teamBBox, "team_b");
    this.burst?.setAlpha(0);
    this.outcomeLabel?.setAlpha(0);
    this.clearTargetFocus();
    this.octopus
      ?.setPosition(640, groundPositionY)
      .setTexture("octopus-idle-front")
      .setAlpha(1);
    this.applyOctopusSize("octopus-idle-front");
  }

  private openChosenProp() {
    if (this.options.outcome === "team_a") {
      this.teamABox
        ?.setTexture("box-open")
        .setPosition(
          targetPositions.team_a.x - openBoxOffsetX,
          openBoxPositionY,
        )
        .setDisplaySize(330, 330)
        .clearTint();
      if (this.teamABox) setOpenBoxOrientation(this.teamABox, "team_a");
    }
    if (this.options.outcome === "team_b") {
      this.teamBBox
        ?.setTexture("box-open")
        .setPosition(
          targetPositions.team_b.x + openBoxOffsetX,
          openBoxPositionY,
        )
        .setDisplaySize(330, 330)
        .clearTint();
      if (this.teamBBox) setOpenBoxOrientation(this.teamBBox, "team_b");
    }
  }

  private highlightChosenProp() {
    const chosen =
      this.options.outcome === "team_a"
        ? this.teamABox
        : this.options.outcome === "team_b"
          ? this.teamBBox
          : null;
    chosen?.clearTint();
  }

  private createMatchupScoreboard() {
    this.createTeamPlate("team_a", this.options.teamACode, "team-a-flag");
    this.createTeamPlate("team_b", this.options.teamBCode, "team-b-flag");
    this.add
      .text(640, 82, "VS", {
        color: "#ffd369",
        fontFamily: "Arial",
        fontSize: "20px",
        fontStyle: "bold",
        stroke: "#03111e",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
  }

  private outcomeLabelText() {
    const result =
      this.options.outcome === "draw"
        ? "DRAW"
        : `${this.options.outcome === "team_a" ? this.options.teamAName : this.options.teamBName} WINS!`;
    return `${result}\n${this.options.teamAName} ${this.options.predictedScoreA90}–${this.options.predictedScoreB90} ${this.options.teamBName}`;
  }

  private createTeamPlate(
    outcome: "team_a" | "team_b",
    primaryLabel: string,
    flagTexture: string,
  ) {
    const x = outcome === "team_a" ? 300 : 980;
    const width = 240;
    const graphics = this.add.graphics();
    graphics.fillStyle(0x031a2c, 0.9);
    graphics.lineStyle(2, 0x7be5ef, 0.75);
    graphics.fillRoundedRect(-width / 2, -38, width, 76, 20);
    graphics.strokeRoundedRect(-width / 2, -38, width, 76, 20);
    graphics.fillStyle(0x4de4e7, 0.95);
    graphics.fillRoundedRect(-width / 2 + 16, 29, width - 32, 3, 2);

    const hasFlag = this.textures.exists(flagTexture);
    const flag = hasFlag
      ? this.add.image(-70, 0, flagTexture).setOrigin(0.5)
      : this.add
          .text(-70, 0, "⚑", {
            color: "#7be5ef",
            fontFamily: "Arial",
            fontSize: "28px",
            fontStyle: "bold",
          })
          .setOrigin(0.5);
    if (hasFlag && flag instanceof Phaser.GameObjects.Image) {
      const source = flag.texture.getSourceImage() as {
        height?: number;
        width?: number;
      };
      const ratio =
        source.width && source.height ? source.width / source.height : 1.5;
      flag.setDisplaySize(Math.min(62, 38 * ratio), 38);
    }
    const title = this.add
      .text(32, 0, primaryLabel, {
        color: "#ffffff",
        fontFamily: "Arial",
        fontSize: "30px",
        fontStyle: "bold",
        stroke: "#03111e",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const plate = this.add
      .container(x, 82, [graphics, flag, title])
      .setAlpha(0.72);
    this.targetPlates.set(outcome, plate);
  }

  private clearTargetFocus() {
    for (const plate of this.targetPlates.values()) {
      this.tweens.killTweensOf(plate);
      plate.setAlpha(0.72).setScale(1);
    }
  }

  private focusTarget(outcome: "team_a" | "team_b") {
    const plate = this.targetPlates.get(outcome);
    if (!plate) return;
    plate.setAlpha(1);
    this.tweens.add({
      targets: plate,
      scale: 1.06,
      duration: 280,
      ease: "Cubic.easeOut",
    });
  }

  private focusDraw() {
    for (const plate of this.targetPlates.values()) {
      plate.setAlpha(1);
    }
  }

  private focusOutcome() {
    if (this.options.outcome === "draw") {
      this.focusDraw();
      return;
    }
    this.focusTarget(this.options.outcome);
  }

  private chosenBurstPosition() {
    if (this.options.outcome === "draw") return { x: 640, y: 410 };
    return {
      x: targetPositions[this.options.outcome].x,
      y: targetPositions[this.options.outcome].y - 125,
    };
  }

  private moveOctopus(x: number, y: number, duration: number) {
    if (!this.octopus) return;
    this.tweens.add({
      targets: this.octopus,
      x,
      y,
      duration: Math.max(duration, 1),
      ease: "Cubic.easeInOut",
    });
  }

  private applyOctopusSize(texture: string) {
    if (!this.octopus) return;
    const size = texture.includes("celebrate")
      ? 360
      : texture.includes("select")
        ? 350
        : 320;
    this.octopus.setDisplaySize(size, size);
  }
}

export function createAquariumGame(
  options: AquariumGameOptions,
): AquariumGameController {
  const scene = new AquariumScene(options);
  // Phaser supports this runtime flag, but Phaser 3.90 omits it from GameConfig.
  const config: Phaser.Types.Core.GameConfig & {
    disableVisibilityChange: boolean;
  } = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: options.container,
    backgroundColor: "#136aa0",
    disableVisibilityChange: true,
    scene,
    transparent: false,
    render: { antialias: true, pixelArt: false },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };
  const game = new Phaser.Game(config);

  return {
    destroy: () => game.destroy(true),
    skip: () => scene.skipSequence(),
    start: () => scene.startSequence(),
  };
}
