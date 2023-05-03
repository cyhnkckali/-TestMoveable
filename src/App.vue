<template>
  <div class="container">
    <div
      v-show="zoom > 2"
      class="menu"
      style="
        color: beige;
        display: flex;
        align-items: center;
        justify-content: center;
      "
      @click="centerScreen"
    >
      <i class="icon-centerpage menu-icon"></i>
    </div>
    <Guides
      v-show="zoom > 2"
      type="horizontal"
      ref="HorizontalGuides"
      className="scena-horizontal-guides"
      :negativeRuler="true"
      backgroundColor="#141414"
      lineColor="#fff"
      textColor="#fff"
      :displayDragPos="true"
      :displayGuidePos="true"
      :zoom="zoomFactor"
      :units="guideUnits"
      :showGuides="true"
      :longLineSize="12"
      :shortLineSize="6"
      :textOffset="[5, 3]"
    />
    <Guides
      v-show="zoom > 2"
      type="vertical"
      ref="VerticalGuides"
      className="scena-vertical-guides"
      :negativeRuler="true"
      backgroundColor="#141414"
      lineColor="#fff"
      textColor="#fff"
      :zoom="zoomFactor"
      :units="guideUnits"
      :displayDragPos="true"
      :displayGuidePos="true"
      :longLineSize="12"
      :shortLineSize="6"
      :textOffset="[3, -5]"
    />
    <VueInfiniteViewer
      ref="InfiniteViewer"
      class="viewer"
      :useWheelScroll="true"
      @wheel="onScrollInfiniteView"
      @scroll="onScrollInfiniteView"
      :zoom="zoomFactor"
    >
      <div class="viewport main" data-element-class-type="TScreen">
        <div
          v-show="gridLineShow"
          v-for="(item, i) in horizontalGridLine"
          :key="i"
          class="horizantalGridLine horizantalGridLineMain"
          :style="`top: ${gridSize * i}px`"
        />
        <div
          v-show="gridLineShow"
          v-for="(item, i) in verticalGridLine"
          :key="i"
          class="verticalGridLine verticalGridLineMain"
          :style="`left: ${gridSize * i}px`"
        />
      </div>
    </VueInfiniteViewer>
  </div>

  <Moveable
    ref="moveableItem"
    className="moveable"
    :target="target"
    :draggable="true"
    :rotatable="target.length == 1 ? true : false"
    :resizable="target.length == 1 ? true : false"
    :dragArea="true"
    :throttleDrag="throttleValue"
    :throttleResize="throttleValue"
    :snappable="true"
    :snapContainer="snapContainer.value"
    :snapDirections="ALL_SNAPS_ENABLED"
    :elementSnapDirections="ALL_SNAPS_ENABLED"
    :isDisplayInnerSnapDigit="true"
    :isDisplaySnapDigit="true"
    :elementGuidelines="getElementGuildelines()"
    :edgeDraggable="false"
    :scrollable="false"
    :originDraggable="true"
    @snap="onSnap"
    @dragOrigin="onDragOrigin"
    @dragOriginEnd="getSelectedData(target)"
    @clickGroup="onClickGroup"
    @dragGroup="onDragGroup"
    @drag="onDrag"
    @rotate="onRotate"
    @resize="onResize"
    @rotateEnd="onRotateEnd"
    @resizeEnd="onResizeEnd"
    @dragEnd="onDragEnd"
    @dragGroupEnd="onDragGroupEnd"
  />

  <vue-selecto
    ref="selecto"
    dragContainer=".container"
    :selectableTargets="['[data-selector-element-id]']"
    :hitRate="0"
    :selectByClick="true"
    :selectFromInside="false"
    :toggleContinueSelect="['ctrl']"
    :ratio="0"
    :throttleRotate="30"
    @dragStart="onSelectorDragStart"
    @select="onSelectItems"
    @selectEnd="onSelectEndItems"
  ></vue-selecto>

  <div v-show="zoomFactorInfo" class="zoom-tool">
    Zoom Factor : {{ zoomFactor }} x
  </div>
  <div class="empty elements"></div>
</template>

<script setup >
import { onMounted, reactive, ref, computed } from "vue";
import Guides from "vue3-guides";
import Moveable from "vue3-moveable";
import { VueSelecto } from "vue3-selecto";
import { getSelectedData } from "./helper/handleSelect";
import VueInfiniteViewer from "vue3-infinite-viewer";

// TODO Info Element
const zoomFactorInfo = ref(false);
const InfiniteViewer = ref(null);
const HorizontalGuides = ref(null);
const VerticalGuides = ref(null);

const patternRotate = /rotate\((-?\d+(\.\d+)?|\.\d+)(deg)?\)/;

const snapContainer = ref(document.getElementsByClassName("main"));

const moveableItem = ref(null);

const selecto = ref(null);

const selectedItem = ref(null);

const target = ref([]);

const ALL_SNAPS_ENABLED = reactive({
  top: true,
  right: true,
  bottom: true,
  left: true,
  center: true,
  middle: true,
});

const onDragOrigin = (e) => {
  e.target.style.transformOrigin = e.transformOrigin;
  e.target.style.transform = e.drag.transform;
};

const onDrag = (e) => {
  if (!ctrlStatus.value) {
    e.target.style.transform = e.transform;
    getElementGuildelines();
  }
};

let statusRotate = true;

const onRotate = (event) => {
  const rotateMatchs = event.drag.transform.match(patternRotate);
  const degre = parseFloat(rotateMatchs[1]).toFixed(0);

  const value = event.drag.transform.replace(
    /rotate\([^)]+\)/,
    `rotate(${degre}deg)`
  );

  const rightAngle = Number.isInteger(degre / 90);

  if (rightAngle && statusRotate) {
    selectedItem.value.style.transform = value;
    statusRotate = false;
    setTimeout(() => {
      statusRotate = true;
    }, 300);
  }

  if (statusRotate) {
    selectedItem.value.style.transform = value;
  }
};

const onResize = (event) => {
  selectedItem.value.style.width = `${event.width}px`;
  selectedItem.value.style.height = `${event.height}px`;
  selectedItem.value.style.transform = event.drag.transform;
};

const onRotateEnd = (e) => {
  getSelectedData(target.value);
};

const onResizeEnd = (e) => {
  getSelectedData(target.value);
};

const onDragEnd = (e) => {
  getSelectedData(target.value);
};

const onDragGroupEnd = () => {
  getSelectedData(target.value);
};

// Selector Functions

const orderSelectList = ref([]);

const onClickGroup = (e) => {
  selecto.value.clickTarget(e.inputEvent, e.inputTarget);
};

const onDragGroup = (e) => {
  getElementGuildelines();
  if (!ctrlStatus.value) {
    e.events.forEach((ev) => {
      ev.target.style.transform = ev.transform;
    });
  }
};

const onSelectItems = (event) => {
  let targetList = [];

  for (let index = 0; index < event.selected.length; index++) {
    const element = event.selected[index];
    if (
      element.parentElement.getAttribute("data-element-class-type") ===
      "TScreen"
    ) {
      targetList.push(element);
    }
  }
  if (event.selected?.length > 1) target.value = targetList;
  else target.value = event.selected;
};

const onSelectEndItems = (event) => {
  if (event.selected.length === 1) {
    selectedItem.value = event.selected[0];
  } else if (event.selected.length > 1) {
    selectedItem.value = null;
  } else {
    selectedItem.value = null;
    target.value = [];
  }

  if (event.isDragStart) {
    event.inputEvent.preventDefault();

    setTimeout(() => {
      moveableItem.value.dragStart(event.inputEvent);
    });
  }
};

const onSelectorDragStart = (e) => {
  const target = e.inputEvent.target;

  // if (
  //   moveableItem.value.isMoveableElement(target) ||
  //   target.value.some((t) => t === target || t.contains(target))
  // ) {
  //   e.stop();
  // }
};

// Item Lines

const onSnap = (e) => {
  let minGap = Number.MAX_SAFE_INTEGER;
  e.gaps.forEach((g) => {
    if (g.gap < minGap) {
      minGap = g.gap;
    }
  });

  // e.gaps.forEach((g) => {
  //   if (g.gap !== minGap) {
  //     g.gapRects.forEach((gr) => {
  //       // $(`.${gr.className}.moveable-gap`)
  //       //   .parents(".moveable-guideline-group")
  //       //   .hide();
  //     });
  //   }
  // });
};

const getElementGuildelines = () => {
  const guidelines = [];

  let targetValue = target.value.map((item) => {
    return item.dataset.selectorElementId;
  });

  document.querySelectorAll(".main").forEach((el) => {
    guidelines.push({
      element: el,
      className: "gl-to-main",
    });
  });

  document.querySelectorAll("[data-selector-element-id]").forEach((el) => {
    if (!targetValue.some((item) => item === el.dataset.selectorElementId)) {
      guidelines.push({
        element: el,
        className: "gl-to-" + el.dataset.selectorElementId,
      });
    }
  });

  // Todo Grid Line lara göre Snap leme

  // document.querySelectorAll(".horizantalGridLine").forEach((el) => {
  //   if (!targetValue.some((item) => item === el.dataset.selectorElementId)) {
  //     guidelines.push({
  //       element: el,
  //       className: "gl-to-horizantalGridLine",
  //     });
  //   }
  // });

  // document.querySelectorAll(".verticalGridLine").forEach((el) => {
  //   if (!targetValue.some((item) => item === el.dataset.selectorElementId)) {
  //     guidelines.push({
  //       element: el,
  //       className: "gl-to-verticalGridLine",
  //     });
  //   }
  // });

  return guidelines;
};

// InfiniteView Scroll Methot
const zooms = [5, 10, 25, 50, 75, 100, 125, 150, 200, 300, 400, 500];
const defaultZoomIndex = zooms.findIndex((v) => v === 100);
const zoom = ref(defaultZoomIndex);
const zoomFactor = computed(() => zooms[zoom.value] / 100);
const guideUnits = ref(1);

const zoomIn = () => {
  zoomFactorInfo.value = true;
  if (zoom.value < zooms.length - 1) zoom.value++;

  setTimeout(() => {
    zoomFactorInfo.value = false;
  }, 1000);
};

const zoomOut = () => {
  zoomFactorInfo.value = true;
  if (zoom.value > 0) zoom.value--;
  setTimeout(() => {
    zoomFactorInfo.value = false;
  }, 1000);
};

const onScrollInfiniteView = (e) => {
  if (e.ctrlKey) e.deltaY < 0 ? zoomIn() : zoomOut();
  if (HorizontalGuides.value) {
    HorizontalGuides.value.scroll(e.scrollLeft);
    HorizontalGuides.value.scrollGuides(e.scrollTop);
  }
  //@ts-ignore
  if (VerticalGuides.value) {
    VerticalGuides.value.scroll(e.scrollTop);
    VerticalGuides.value.scrollGuides(e.scrollLeft);
  }

  moveableItem.value?.updateRect();
};

// Grid Line Function

const gridLineShow = ref(true);
const gridSize = ref(10);
const mainWidth = ref(700);
const mainHeight = ref(500);

const verticalGridLine = ref(
  new Array(Math.floor(mainWidth.value / gridSize.value) + 1)
);
const horizontalGridLine = ref(
  new Array(Math.floor(mainHeight.value / gridSize.value) + 1)
);

// Throttle Resize and Drag
const throttleStatus = ref(false);
const throttleValue = ref(1);

// Extra Function

/**
 * @description Ekranı tekrar merkeze çekmeye yarayan fonksiyondur - Dizayn tarafında kullanımı FB_Center_Screen
 */
function centerScreen() {
  InfiniteViewer.value.scrollCenter();
}

const ctrlStatus = ref(false);

onMounted(() => {
  InfiniteViewer.value.resize();
  HorizontalGuides.value.resize();
  VerticalGuides.value.resize();

  window.addEventListener("resize", () => {
    try {
      HorizontalGuides.value.resize();
      VerticalGuides.value.resize();
      InfiniteViewer.value.scrollCenter();
    } catch (error) {}
  });

  document.querySelector(".viewport").style.width = mainWidth.value + "px";
  document.querySelector(".viewport").style.height = mainHeight.value + "px";
  InfiniteViewer.value.scrollCenter();
});
</script>
    
<style >
@import url("./assets/base.css");
</style>

