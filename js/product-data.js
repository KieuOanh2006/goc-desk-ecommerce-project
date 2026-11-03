/* Danh mục sản phẩm dùng chung. */
(function (root) {
const categories = [
  {
    "id": "keyboard",
    "name": "Bàn phím"
  },
  {
    "id": "mouse",
    "name": "Chuột máy tính"
  },
  {
    "id": "lamp",
    "name": "Đèn bàn"
  },
  {
    "id": "stand",
    "name": "Giá đỡ laptop"
  },
  {
    "id": "pad",
    "name": "Pad chuột & lót bàn"
  },
  {
    "id": "organize",
    "name": "Kệ & sắp xếp"
  }
];
const products = [
  {
    "id": "hyperone-gen-2",
    "name": "HyperOne Gen 2",
    "fullName": "Bàn phím không dây HyperWork HyperOne Gen 2 - KB1 G2",
    "description": "Êm ái từng phím gõ",
    "brand": "HyperWork",
    "category": "keyboard",
    "uses": [
      "work",
      "study"
    ],
    "price": 680000,
    "image": "images/product-pages/hyperone-gen-2.jpg",
    "source": "https://hyperwork.vn/products/hyperone-gen-2",
    "features": [
      "Khung nhôm cao cấp",
      "Thiết kế mỏng nhẹ, nhỏ gọn, dễ dàng mang theo",
      "Phím dùng cơ chế cắt kéo &quot;X-Scissors&quot; mang lại cảm giác gõ êm ái, giảm tiếng ồn đến 80%"
    ],
    "specs": [
      [
        "Khung",
        "Nhôm"
      ],
      [
        "Cơ chế phím",
        "X-Scissors (cắt kéo)"
      ],
      [
        "Kết nối",
        "2 chế độ kết nối"
      ],
      [
        "Thời lượng sử dụng",
        "125 giờ; chờ 250 giờ"
      ],
      [
        "Bảo hành hãng",
        "12 tháng"
      ]
    ],
    "colors": [
      {
        "id": "black",
        "name": "Đen",
        "hex": "#28292b",
        "image": "images/product-pages/hyperone-gen-2.jpg",
        "generated": false
      },
      {
        "id": "cream",
        "name": "Kem",
        "hex": "#e8dfcf",
        "image": "images/product-pages/variants/hyperone-gen-2-cream.png",
        "generated": true
      }
    ]
  },
  {
    "id": "silentium-gen-2",
    "name": "Silentium Gen 2",
    "fullName": "Chuột không dây Silentium Gen 2",
    "description": "Lướt êm, làm việc tập trung",
    "brand": "HyperWork",
    "category": "mouse",
    "uses": [
      "work",
      "study"
    ],
    "price": 649000,
    "image": "images/product-pages/silentium-gen-2.jpg",
    "source": "https://hyperwork.vn/products/chuot-khong-day-silentium-gen-2",
    "features": [
      "Bản kế thừa & nâng cấp của HyperWork Silentium",
      "Thiết kế form đối xứng, có phần lõm hai bên hông đáp ứng công thái học, phù hợp mọi dáng tay, hạn chế mỏi khi thao tác lâu",
      "Sản phẩm đầu tiên trang bị con lăn ngang, thuận lợi khi thiết kế, đọc tài liệu"
    ],
    "specs": [
      [
        "Thiết kế",
        "Đối xứng, lõm hai bên hông"
      ],
      [
        "Con lăn",
        "Air Spin; con lăn ngang"
      ],
      [
        "Kết nối",
        "Receiver Type-A, Type-C và Bluetooth"
      ],
      [
        "Thiết bị",
        "Kết nối tối đa 3 thiết bị"
      ],
      [
        "Pin",
        "Lên đến 70 ngày"
      ],
      [
        "Bảo hành hãng",
        "12 tháng"
      ]
    ],
    "colors": [
      {
        "id": "black",
        "name": "Đen",
        "hex": "#28292b",
        "image": "images/product-pages/silentium-gen-2.jpg",
        "generated": false
      },
      {
        "id": "cream",
        "name": "Kem",
        "hex": "#e8dfcf",
        "image": "images/product-pages/variants/silentium-gen-2-cream.png",
        "generated": true
      }
    ]
  },
  {
    "id": "nova-dl02",
    "name": "Nova DL02",
    "fullName": "Đèn để bàn HyperWork Nova - DL02",
    "description": "Ánh sáng cho từng ý tưởng",
    "brand": "HyperWork",
    "category": "lamp",
    "uses": [
      "work",
      "study"
    ],
    "price": 570000,
    "image": "images/product-pages/nova-dl02.jpg",
    "source": "https://hyperwork.vn/products/den-ban-hyperwork-nova-dl02",
    "features": [
      "Chip LED RG0 không ánh sáng xanh, Flicker Free không chớp nháy, chống mỏi mắt, bảo vệ thị lực",
      "Độ sáng tối đa lên đến 1000 lumen, tùy chỉnh linh hoạt 5 cấp độ",
      "Chỉ số hoàn màu CRI 95 Ra, cho ánh sáng chân thực, gần tương đương ánh sáng tự nhiên"
    ],
    "specs": [
      [
        "Chip LED",
        "RG0; Flicker Free"
      ],
      [
        "Độ sáng tối đa",
        "1000 lumen"
      ],
      [
        "Điều chỉnh sáng",
        "5 cấp độ"
      ],
      [
        "Chỉ số hoàn màu",
        "CRI 95 Ra"
      ],
      [
        "Hẹn giờ",
        "Tắt sau 1 phút"
      ],
      [
        "Bảo hành hãng",
        "12 tháng"
      ]
    ],
    "colors": [
      {
        "id": "white",
        "name": "Trắng",
        "hex": "#f1f0e9",
        "image": "images/product-pages/nova-dl02.jpg",
        "generated": false
      },
      {
        "id": "sage",
        "name": "Xanh sage",
        "hex": "#879b83",
        "image": "images/product-pages/variants/nova-dl02-sage.png",
        "generated": true
      }
    ]
  },
  {
    "id": "lh01",
    "name": "Kẹp laptop LH01",
    "fullName": "Kẹp laptop để dọc HyperWork LH01",
    "description": "Đặt dọc laptop, gọn mặt bàn",
    "brand": "HyperWork",
    "category": "stand",
    "uses": [
      "work",
      "organize"
    ],
    "price": 515000,
    "image": "images/product-pages/lh01.jpg",
    "source": "https://hyperwork.vn/products/kep-laptop-lh01",
    "features": [
      "Bảo vệ laptop, tránh xước xát, rơi vỡ",
      "Có thể điều chỉnh độ rộng của khe phù hợp độ dày của laptop",
      "Đồng bộ cùng các sản phẩm Premium Collection, làm đẹp không gian"
    ],
    "specs": [
      [
        "Cách bố trí",
        "Kẹp laptop theo chiều dọc"
      ],
      [
        "Khe kẹp",
        "Điều chỉnh theo độ dày laptop"
      ],
      [
        "Công dụng",
        "Bảo vệ laptop, hạn chế xước xát"
      ],
      [
        "Bộ sưu tập",
        "Premium Collection"
      ]
    ],
    "colors": [
      {
        "id": "brown",
        "name": "Nâu",
        "hex": "#91613f",
        "image": "images/product-pages/lh01.jpg",
        "generated": false
      },
      {
        "id": "oak",
        "name": "Gỗ sáng",
        "hex": "#caa777",
        "image": "images/product-pages/variants/lh01-oak.png",
        "generated": true
      }
    ]
  },
  {
    "id": "corepad",
    "name": "CorePad",
    "fullName": "Pad chuột HyperWork Core Pad",
    "description": "Một bề mặt, nhiều cảm hứng",
    "brand": "HyperWork",
    "category": "pad",
    "uses": [
      "work",
      "study"
    ],
    "price": 69000,
    "image": "images/product-pages/corepad.jpg",
    "source": "https://hyperwork.vn/products/pad-chuot-hyperwork-corepad",
    "features": [
      "Thuộc Core Collection, đáp ứng tiêu chí tiết kiệm chi phí, linh hoạt, bền bỉ",
      "Họa tiết Aero Dynamic Wave tối giản, hiện đại như pad gaming Fable",
      "4 phân loại kích thước S, L, XL, XXL"
    ],
    "specs": [
      [
        "Kích thước đang giới thiệu",
        "Size S – 25 × 20 cm"
      ],
      [
        "Kích thước khác",
        "L, XL, XXL"
      ],
      [
        "Cấu tạo",
        "3 lớp"
      ],
      [
        "Bề mặt",
        "Vải Multispandex Jersey, phủ chống nước"
      ],
      [
        "Đế",
        "Cao su chống trượt"
      ],
      [
        "Sai số kích thước",
        "1–2% theo công bố hãng"
      ],
      [
        "Bảo hành hãng",
        "12 tháng"
      ]
    ],
    "colors": [
      {
        "id": "black",
        "name": "Đen",
        "hex": "#28292b",
        "image": "images/product-pages/corepad.jpg",
        "generated": false
      },
      {
        "id": "sage",
        "name": "Xanh sage",
        "hex": "#879b83",
        "image": "images/product-pages/variants/corepad-sage.png",
        "generated": true
      }
    ]
  },
  {
    "id": "ds02",
    "name": "Kệ màn hình DS02",
    "fullName": "Kệ màn hình HyperWork - DS02",
    "description": "Thêm khoảng trống để sáng tạo",
    "brand": "HyperWork",
    "category": "organize",
    "uses": [
      "work",
      "organize"
    ],
    "price": 1050000,
    "image": "images/product-pages/ds02.jpg",
    "source": "https://hyperwork.vn/products/ke-man-hinh-hyperwork-ds02",
    "features": [
      "Thiết kế 2 tầng, tận dụng tối đa khu vực dưới màn hình, đáp ứng nhu cầu lưu trữ gọn gàng, khoa học",
      "Chất liệu gỗ cao su với kết cấu chịu lực tốt, thiết kế bo tròn các cạnh, hạn chế va chạm",
      "Khay thép tầng dưới có thể để bàn phím, chuột, dễ dàng tháo rời để vệ sinh"
    ],
    "specs": [
      [
        "Thiết kế",
        "2 tầng"
      ],
      [
        "Chất liệu kệ",
        "Gỗ cao su"
      ],
      [
        "Tầng dưới",
        "Khay thép tháo rời"
      ],
      [
        "Ngăn kéo",
        "Có lỗ phía sau để đi dây"
      ],
      [
        "Mặt kệ",
        "Khe lõm đặt tablet, điện thoại hoặc bút"
      ]
    ],
    "colors": [
      {
        "id": "brown",
        "name": "Nâu",
        "hex": "#91613f",
        "image": "images/product-pages/ds02.jpg",
        "generated": false
      },
      {
        "id": "oak",
        "name": "Gỗ sáng",
        "hex": "#caa777",
        "image": "images/product-pages/variants/ds02-oak.png",
        "generated": true
      }
    ]
  },
  {
    "id": "hs01",
    "name": "Giá đỡ tai nghe HS01",
    "fullName": "Giá đỡ tai nghe HyperWork - HS01",
    "description": "Một chỗ riêng cho tai nghe",
    "brand": "HyperWork",
    "category": "organize",
    "uses": [
      "work",
      "organize"
    ],
    "price": 410000,
    "image": "images/product-pages/hs01.jpg",
    "source": "https://hyperwork.vn/products/gia-do-tai-nghe-hyperwork-hs01",
    "features": [
      "Bảo vệ tai nghe, tránh thất lạc, rơi, hỏng hóc",
      "Tích hợp chân đế khay gỗ đựng thêm đồ",
      "Đồng bộ cùng các sản phẩm Premium Collection, làm đẹp không gian"
    ],
    "specs": [
      [
        "Công dụng",
        "Giá đỡ tai nghe"
      ],
      [
        "Chân đế",
        "Tích hợp khay gỗ đựng đồ"
      ],
      [
        "Bộ sưu tập",
        "Premium Collection"
      ]
    ],
    "colors": [
      {
        "id": "brown",
        "name": "Nâu",
        "hex": "#91613f",
        "image": "images/product-pages/hs01.jpg",
        "generated": false
      },
      {
        "id": "oak",
        "name": "Gỗ sáng",
        "hex": "#caa777",
        "image": "images/product-pages/variants/hs01-oak.png",
        "generated": true
      }
    ]
  },
  {
    "id": "cm02",
    "name": "Khay đi dây CM02",
    "fullName": "Khay đi dây nam châm HyperWork - CM02",
    "description": "Giấu dây gọn, giữ góc thoáng",
    "brand": "HyperWork",
    "category": "organize",
    "uses": [
      "work",
      "organize"
    ],
    "price": 89000,
    "image": "images/product-pages/cm02.jpg",
    "source": "https://hyperwork.vn/products/khay-di-day-nam-cham-hyperwork-cm-02",
    "features": [
      "Thiết kế nam châm gắn, dễ dàng lắp đặt",
      "Kết cấu 100% kim loại cao cấp",
      "Sơn tĩnh điện mịn màng"
    ],
    "specs": [
      [
        "Lắp đặt",
        "Gắn bằng nam châm"
      ],
      [
        "Kết cấu",
        "100% kim loại"
      ],
      [
        "Hoàn thiện",
        "Sơn tĩnh điện"
      ],
      [
        "Công dụng",
        "Hỗ trợ quản lý dây cáp"
      ],
      [
        "Bảo hành hãng",
        "12 tháng"
      ]
    ],
    "colors": [
      {
        "id": "black",
        "name": "Đen",
        "hex": "#28292b",
        "image": "images/product-pages/cm02.jpg",
        "generated": false
      },
      {
        "id": "cream",
        "name": "Kem",
        "hex": "#e8dfcf",
        "image": "images/product-pages/variants/cm02-cream.png",
        "generated": true
      }
    ]
  }
];
root.GocDeskCatalog = { categories, products };
})(globalThis);
