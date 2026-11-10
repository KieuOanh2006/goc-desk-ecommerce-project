(function (root) {
  'use strict';

  const ROOM = { minX: -3.8, maxX: 3.8, minZ: -2.35, maxZ: 2.35 };
  const FURNITURE = {
    desk: { width: 2.35, depth: 0.86, height: 0.82, label: 'Bàn làm việc' },
    cabinet: { width: 1.18, depth: 0.52, height: 1.92, label: 'Tủ đựng đồ' },
    bed: { width: 1.65, depth: 2.05, height: 0.52, label: 'Giường + nệm + gối' },
    chair: { width: 0.62, depth: 0.62, height: 0.86, label: 'Ghế' },
    rug: { width: 2.5, depth: 1.8, height: 0.025, label: 'Thảm' },
    plant: { width: 0.48, depth: 0.48, height: 1.05, label: 'Cây xanh' },
  };
  const common = {
    room: ROOM,
    furniture: FURNITURE,
    cameraPresets: {
      room: { label: 'Toàn phòng', theta: 0.68, phi: 1.08, radius: 7.4, target: { x: 0, y: 1, z: 0 } },
      desk: { label: 'Góc bàn', theta: 0.68, phi: 0.96, radius: 4.3, target: { x: 0.35, y: 0.78, z: 0.06 } },
      top: { label: 'Từ trên xuống', theta: 0.48, phi: 0.16, radius: 7.3, target: { x: 0, y: 0.25, z: 0 } },
    },
  };
  const scenes = [
    {
      id: 'bedroom', name: 'Phòng ngủ khép kín', shortName: 'Phòng kín',
      description: 'Phòng khép kín, phân vùng nghỉ ngơi và làm việc.',
      backWindow: false, balcony: false,
      cameraPresets: {
        room: Object.assign({}, common.cameraPresets.room, { target: { x: -0.1, y: 0.92, z: 0 } }),
        desk: common.cameraPresets.desk,
        top: Object.assign({}, common.cameraPresets.top, { target: { x: -0.1, y: 0.25, z: 0 } }),
      },
      furniture: {
        desk: { x: 0.25, z: -1.1, rotation: 0 }, cabinet: { x: -3.02, z: 1.0, rotation: 0 },
        bed: { x: -2.15, z: -0.55, rotation: Math.PI / 2 }, chair: { x: 1.8, z: 0.3, rotation: 0 },
        rug: { x: 0.3, z: 0.1, rotation: 0 }, plant: { x: 3.05, z: 1.45, rotation: 0 },
      },
    },
    {
      id: 'window', name: 'Phòng có cửa sổ', shortName: 'Có cửa sổ',
      description: 'Bàn đặt cạnh cửa sổ, đón ánh sáng tự nhiên.',
      backWindow: true, balcony: false,
      cameraPresets: {
        room: Object.assign({}, common.cameraPresets.room, { radius: 7.7, target: { x: 0, y: 0.96, z: -0.1 } }),
        desk: common.cameraPresets.desk,
        top: Object.assign({}, common.cameraPresets.top, { target: { x: 0, y: 0.25, z: -0.1 } }),
      },
      furniture: {
        desk: { x: 0.05, z: -1.16, rotation: 0 }, cabinet: { x: -3.04, z: 0.55, rotation: 0 },
        bed: { x: 2.12, z: 0.1, rotation: 0 }, chair: { x: 0.05, z: 0.18, rotation: 0 },
        rug: { x: 0.05, z: 0.18, rotation: 0 }, plant: { x: 3.05, z: 1.55, rotation: 0 },
      },
    },
    {
      id: 'balcony', name: 'Cửa sổ & ban công', shortName: 'Cửa sổ & ban công',
      description: 'Có cửa sổ riêng và cửa kính ra ban công làm bối cảnh.',
      backWindow: true, balcony: true,
      cameraPresets: {
        room: Object.assign({}, common.cameraPresets.room, { radius: 8.1, target: { x: 0.05, y: 0.96, z: -0.34 } }),
        desk: common.cameraPresets.desk,
        top: Object.assign({}, common.cameraPresets.top, { target: { x: 0.05, y: 0.25, z: -0.34 } }),
      },
      furniture: {
        desk: { x: -1.2, z: -1.1, rotation: 0 }, cabinet: { x: -3.02, z: 0.58, rotation: 0 },
        bed: { x: 2.35, z: 0.42, rotation: 0 }, chair: { x: -1.2, z: 0.18, rotation: 0 },
        rug: { x: -0.55, z: 0.35, rotation: 0 }, plant: { x: -3.03, z: 1.55, rotation: 0 },
      },
    },
  ];

  root.GocDeskStudioPresets = {
    ROOM, FURNITURE, scenes, cameraPresets: common.cameraPresets,
    sceneById: Object.fromEntries(scenes.map((scene) => [scene.id, scene])),
  };
})(globalThis);
