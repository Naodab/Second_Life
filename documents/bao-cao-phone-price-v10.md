# PHỤ LỤC BÁO CÁO ĐỒ ÁN — MODULE GỢI Ý GIÁ ĐIỆN THOẠI (AI)

> **Hướng dẫn sử dụng:** Đây là nội dung bổ sung cho đồ án Second Life. Chèn **mục 1.4** vào Chương 1, **mục 2.5** vào Chương 2, **mục 3.4** vào Chương 3 — các mục khác của từng chương do sinh viên tự trình bày.

**Phạm vi:** Gợi ý giá điện thoại cũ bằng XGBoost, huấn luyện trên dữ liệu Chợ Tốt, triển khai qua `aiservice` (Flask) tích hợp `productservice` (Spring Boot).

---

# Chương 1. Cơ sở lý thuyết

## 1.4. Giới thiệu thuật toán XGBoost

### 1.4.1. Bối cảnh lựa chọn mô hình

Trong đồ án, bài toán gợi ý giá điện thoại cũ được mô hình hóa dưới dạng **hồi quy**: từ tập đặc trưng mô tả sản phẩm (thông số kỹ thuật, tình trạng, nội dung tin đăng, metadata…) dự đoán giá bán (VND). Dữ liệu đầu vào có dạng **bảng (tabular)** — hỗn hợp biến số, biến phân loại và đặc trưng kỹ thuật được trích xuất — với quan hệ phi tuyến giữa các yếu tố (ví dụ: cùng hãng nhưng khác model cho giá chênh lệch lớn).

Trong các họ thuật toán phổ biến cho dữ liệu dạng bảng, **XGBoost (eXtreme Gradient Boosting)** được lựa chọn làm mô hình chính vì: (i) khả năng học tương tác phi tuyến phức tạp mà không cần kỹ thuật đặc trưng thủ công quá nhiều; (ii) xử lý tốt giá trị thiếu; (iii) hiệu năng ổn định trên tập dữ liệu cỡ vài chục nghìn mẫu; (iv) hỗ trợ regularization giúp kiểm soát overfitting.

### 1.4.2. Nguyên lý Gradient Boosting

Gradient Boosting là phương pháp **ensemble** xây dựng mô hình từ tập hợp các cây quyết định yếu (weak learner). Giả sử có \(K\) cây, dự đoán cuối cùng là tổng dự đoán của từng cây:

$$\hat{y}_i = \sum_{k=1}^{K} f_k(x_i)$$

Thuật toán hoạt động theo hướng **bổ sung (additive)**: tại mỗi bước, cây mới được huấn luyện để dự đoán **phần dư (residual)** — sai số còn lại — của các cây trước đó, tương đương với đi theo hướng **gradient âm** của hàm mất mát. Nhờ đó, mỗi cây sau tập trung sửa những mẫu mà mô hình hiện tại dự đoán kém nhất.

Đối với bài toán hồi quy, hàm mất mát thường dùng là **sai số bình phương trung bình (MSE)**. Trong đồ án, biến mục tiêu được biến đổi logarit `log(1 + price_vnd)` trước khi đưa vào mô hình nhằm giảm ảnh hưởng của phân phối giá lệch phải; sau dự đoán, kết quả được chuyển ngược về VND.

### 1.4.3. Đặc điểm của XGBoost

XGBoost là triển khai tối ưu hóa của Gradient Boosting do Chen và Guestrin (2016) đề xuất, với các điểm khác biệt chính:

**Cấu trúc cây và tách nút.** XGBoost xây dựng cây theo chiều sâu (depth-wise), mỗi lần tách chọn đặc trưng và ngưỡng sao cho hàm mục tiêu (gain) tối đa. Thuật toán hỗ trợ xử lý trực tiếp giá trị thiếu bằng cách học hướng rẽ mặc định cho từng nút.

**Hàm mục tiêu có regularization.** XGBoost không chỉ tối thiểu hóa loss mà còn cộng thêm penalty vào độ phức tạp của mô hình (số lá, độ lớn trọng số lá), giúp giảm overfitting:

$$\mathcal{L} = \sum_{i} l(y_i, \hat{y}_i) + \sum_{k} \Omega(f_k)$$

trong đó \(\Omega\) kiểm soát độ sâu cây, số lá và trọng số — tương ứng các siêu tham số `max_depth`, `min_child_weight`, `gamma`, `reg_alpha`, `reg_lambda` trong quá trình huấn luyện.

**Xấp xỉ Newton và tối ưu hóa.** Tại mỗi bước, XGBoost sử dụng đạo hàm bậc nhất và bậc hai (xấp xỉ Newton) của hàm mất mát để xác định cấu trúc cây hiệu quả hơn so với boosting truyền thống chỉ dùng gradient bậc nhất.

**Subsampling và column sampling.** Các tham số `subsample` (lấy mẫu theo hàng) và `colsample_bytree` (lấy mẫu theo cột) giúp tăng tính đa dạng giữa các cây, tương tự ý tưởng bagging, cải thiện khả năng tổng quát hóa.

**Tốc độ tính toán.** XGBoost hỗ trợ huấn luyện song song, xử lý sparse data và cache-aware access, phù hợp huấn luyện trên Google Colab với tập ~10.000 mẫu và 26 đặc trưng.

### 1.4.4. XGBoost trong pipeline định giá điện thoại

Trong module gợi ý giá của đồ án, XGBoost được nhúng trong `Pipeline` scikit-learn với bước tiền xử lý phía trước (Target Encoding cho biến `model`, `color`). Mô hình cuối cùng là `XGBRegressor` với siêu tham số được tối ưu bằng Optuna (50 trials, tiêu chí CV R²).

Lý do XGBoost phù hợp cụ thể với bài toán định giá điện thoại cũ:

| Đặc điểm dữ liệu | Cách XGBoost xử lý |
|---|---|
| Biến phân loại cardinality cao (`model`) | Kết hợp Target Encoding trước, XGBoost học tương tác với các đặc trưng số còn lại |
| Giá trị thiếu (`battery_pct`, `processor`) | XGBoost học hướng rẽ mặc định; không cần impute hoàn toàn |
| Tương tác phi tuyến (tuổi máy × tình trạng) | Cây quyết định tự phát hiện qua các lần tách nút |
| Nhiễu từ thị trường đồ cũ | Regularization + cross-validation giúp kiểm soát overfitting |

Kết quả thực nghiệm (mục 3.4) cho thấy XGBoost đạt Test R² = **0,8058**, MAE = **1,81 triệu VND** trên tập kiểm thử 2.479 mẫu — được lựa chọn triển khai chính thức thay cho LightGBM (Test R² = 0,8039) dù hai mô hình có CV R² tương đương.

---

# Chương 2. Phân tích và thiết kế hệ thống

## 2.5. Phân tích và thiết kế module gợi ý giá điện thoại (AI)

### 2.5.1. Phân tích yêu cầu chức năng

Module AI gợi ý giá được tích hợp vào luồng đăng tin bán hàng tại Seller Hub, với phạm vi hẹp: **chỉ điện thoại, chỉ tin bán (BUY)**. Khi người bán nhập thông tin sản phẩm và yêu cầu gợi ý giá, hệ thống cần:

1. Trả về **giá gợi ý** (`suggestedPriceVnd`) bằng VND.
2. Cung cấp **khoảng giá** min/max hỗ trợ thương lượng.
3. Đánh giá **mức tin cậy** (HIGH / MEDIUM / LOW) theo độ đầy đủ thông tin.
4. Giải thích ngắn bằng tiếng Việt (`reasoningBrief`).

Các ràng buộc kỹ thuật: thời gian phản hồi dưới 1 giây; logic trích đặc trưng đồng nhất giữa notebook huấn luyện (`aiservice/train/`) và mã suy luận (`aiservice/app/features.py`); tách biệt tầng train (Colab) và tầng serve (Docker) qua artifacts export.

### 2.5.2. Phân tích dữ liệu huấn luyện

#### Nguồn dữ liệu và quy mô

Dữ liệu thu thập từ tin đăng trên **Chợ Tốt**, tệp `phone_tablet_dataset_raw.csv`:

| Chỉ số | Giá trị |
|--------|---------|
| Số bản ghi thô | 12.904 |
| Số thuộc tính | 45 |
| Phạm vi giá lọc | 500.000 – 80.000.000 VND |
| Bản ghi sau làm sạch | **12.391** |
| Tập train / test (80/20) | 9.912 / 2.479 |

Các trường quan trọng: `price_vnd`, `brand`, `model`, `ram_gb`, `storage_gb`, `screen_inches`, `sl_condition`, `region_name`, `title`, `description`, `num_images`, `origin_code`, `warranty_code`, `sim_lock`.

#### Quy trình tiền xử lý

```
12.904 (thô)
  → Lọc giá [500k – 80M]         −168   → 12.736
  → Lọc danh mục điện thoại                12.736
  → Chuẩn hóa + trích tín hiệu text        12.736
  → Dropna thuộc tính lõi                   12.736
  → Lọc outlier toàn cục (P1–P99)  −229   → 12.507
  → Lọc outlier theo model (MAD)   −116   → 12.391
```

**Lọc ngoại lai MAD:** với mỗi model có ≥ 8 mẫu, loại tin có giá lệch quá \(4 \times 1{,}4826 \times \text{MAD}\) so với median của model. Mục đích: loại giá mồi, giá nhập sai trên thị trường Chợ Tốt vốn nhiễu.

#### Phân tích phân phối giá

Phân phối giá thô **lệch phải mạnh** — đa số tin ở phân khúc bình dân và tầm trung, ít tin flagship giá cao. Biến đổi `log(1 + price)` làm phân phối tiệm cận chuẩn hơn, phù hợp hồi quy (Hình 2.5.1b).

Phân khúc sau làm sạch:

| Phân khúc | Ngưỡng | Nhận xét |
|-----------|--------|----------|
| Bình dân | < 5 triệu | Máy cũ, giá rẻ; biến động tương đối cao |
| Tầm trung | 5 – 15 triệu | Chiếm tỷ lệ lớn nhất; đa dạng model |
| Cao cấp | > 15 triệu | Flagship, Like New; ít mẫu hơn |

![Hình 2.5.1 — Tổng quan tập dữ liệu](./images/phone-pricing/figS1.png)

*Hình 2.5.1. (a) Phân phối giá, (b) phân phối log-price, (c) tỷ lệ phân khúc, (d) số tin theo hãng, (e) tỷ lệ thiếu dữ liệu.*

#### Phân tích theo hãng, tình trạng và khu vực

**Hãng sản xuất:** Apple, Samsung, Xiaomi, Oppo, Vivo, Realme chiếm đa số. Giá trung vị: Apple cao nhất → Samsung flagship → hãng Trung Quốc. Trong cùng hãng, độ phân tán giá lớn do khác model và tình trạng (Hình 2.5.2a).

**Tình trạng:** Like New > Good > Fair theo giá trung vị. Nhóm Good chiếm tỷ lệ lớn nhất, dải giá rộng nhất (Hình 2.5.2b).

**Khu vực:** HCM và Hà Nội có giá trung vị cao hơn Đà Nẵng và "Khác" ở mọi phân khúc — phản ánh sức mua và quy mô thị trường điện thoại cũ (Hình 2.5.2c).

![Hình 2.5.2 — Giá theo nhóm](./images/phone-pricing/figS2.png)

*Hình 2.5.2. (a) Phân phối giá theo hãng, (b) theo tình trạng, (c) theo khu vực và phân khúc.*

#### Phân tích giá trị thiếu và chiến lược xử lý

| Thuộc tính | Mức thiếu | Xử lý |
|------------|-----------|-------|
| `processor` | > 50% | Lookup `chip_gen` từ tên model; impute median theo hãng |
| `manufacture_year` | Trung bình | Parse năm từ title/description; fallback median tuổi |
| `screen_inches` | Trung bình | Impute median toàn tập |
| `ram_gb`, `storage_gb` | Thấp–TB | Impute median |
| `color` | Thấp | Gán `__NA__` |

Tỷ lệ khớp chip trực tiếp: **30,3%**; phần còn lại dùng median theo hãng — **không dùng giá** để impute, tránh rò rỉ dữ liệu.

#### Phân tích tín hiệu văn bản

Từ `title` + `description`, trích ba nhóm tín hiệu:

| Tín hiệu | Tỷ lệ tin có | Ý nghĩa |
|----------|-------------|---------|
| `title_quality_score > 0` | 58,3% | Từ khóa tích cực: zin, fullbox, bảo hành… |
| `title_defect_score > 0` | 25,5% | Từ khóa lỗi: trầy, nứt, chai pin… |
| Có % pin | 11,1% | Regex "pin XX%" |
| `is_age_known = 1` | 10,7% | Biết năm SX; median tuổi = 4,0 năm |

**Ảnh hưởng đến giá (Hình 2.5.3):**
- `quality_score` tăng → giá trung vị tăng (mỗi từ khóa tích cực phản ánh máy zin, fullbox).
- `defect_score` tăng → giá trung vị giảm.
- Pin 95–100% cao hơn rõ rệt so với 50–79%.

Điều này cho thấy **ba mức condition (Like New / Good / Fair) không đủ** mô tả sắc thái thực tế — cần bổ sung tín hiệu văn bản vào mô hình.

![Hình 2.5.3 — Tín hiệu văn bản](./images/phone-pricing/figS4.png)

*Hình 2.5.3. Mối quan hệ từ khóa chất lượng, từ khóa lỗi và % pin với giá bán.*

#### Phân tích theo thông số kỹ thuật

| Thông số | Xu hướng | Giải thích |
|----------|----------|------------|
| RAM | Tăng 2→8 GB, sau đó plateau | Cấu hình cao hơn → giá cao hơn; flagship đã saturate |
| Storage | Tăng mạnh 64→256 GB→1 TB | Apple/Samsung premium theo tier bộ nhớ |
| Chip gen | Gen 4–5 > Gen 1–2 | Chip mới giữ giá tốt hơn |
| Tuổi máy | Giảm đơn điệu | Khấu hao theo thời gian |

![Hình 2.5.4 — Giá theo thông số kỹ thuật](./images/phone-pricing/figS5.png)

*Hình 2.5.4. Giá trung vị theo RAM, bộ nhớ, thế hệ chip và tuổi máy.*

#### Ma trận tương quan

Hình 2.5.5 trình bày hệ số tương quan Pearson:

- **Dương mạnh với giá:** `storage_gb`, `chip_gen`, `condition_score`, `spec_score`, `title_quality_score`
- **Âm với giá:** `age_years`, `depreciation_score`, `title_defect_score`
- `ram_gb` và `storage_gb` tương quan cao → XGBoost xử lý đa cộng tuyến tốt hơn hồi quy tuyến tính

![Hình 2.5.5 — Ma trận tương quan](./images/phone-pricing/figS3.png)

*Hình 2.5.5. Ma trận tương quan giữa các đặc trưng số và biến mục tiêu.*

#### Kết luận phân tích dữ liệu

1. Tập 12.391 mẫu **đủ quy mô**, đa hãng, đa phân khúc — phù hợp huấn luyện mô hình định giá.
2. Dữ liệu **nhiễu**, cần lọc MAD và impute thông minh.
3. **Tín hiệu văn bản** (keyword, pin) có giá trị dự đoán độc lập, bổ sung cho condition 3 mức.
4. Biến `model` là yếu tố quyết định giá mạnh nhất — cần mã hóa bằng Target Encoding **cross-fit** để tránh leakage.
5. Biến đổi log-price **cần thiết** do phân phối lệch.

![Hình 2.5.6 — Khảo sát sơ bộ](./images/phone-pricing/eda_v10.png)

*Hình 2.5.6. Khảo sát sơ bộ: log-price, giá median theo hãng, giá theo defect score.*

### 2.5.3. Thiết kế pipeline học máy

#### Kiến trúc pipeline

```
Dữ liệu Chợ Tốt → Tiền xử lý → Feature Engineering (26 đặc trưng)
    → TargetEncoder(model, color) [cross-fit 5-fold]
    → XGBRegressor → Optuna tuning → Export artifacts → Flask API
```

![Hình 2.5.7 — Kiến trúc pipeline](./images/phone-pricing/figS6.png)

*Hình 2.5.7. Sơ đồ pipeline từ dữ liệu thô đến mô hình triển khai.*

#### Bộ đặc trưng (26 features)

| Nhóm | Đặc trưng | Số lượng |
|------|-----------|----------|
| Target-encoded | `model`, `color` | 2 |
| Mã hóa nhãn | `brand_enc`, `sl_condition_enc`, `region_group_enc`, `sim_lock_enc` | 4 |
| Thông số phần cứng | `ram_gb`, `storage_gb`, `screen_inches`, `chip_gen`, `chip_x_age` | 5 |
| Tình trạng & tuổi | `condition_score`, `age_years`, `is_age_known` | 3 |
| Nguồn gốc & bảo hành | `origin_code`, `is_official`, `warranty_code`, `has_warranty` | 4 |
| Tổng hợp | `spec_score`, `depreciation_score` | 2 |
| Metadata tin | `num_images`, `has_video` | 2 |
| Văn bản | `title_quality_score`, `title_defect_score`, `has_battery_info`, `battery_pct` | 4 |

Công thức đặc trưng tổng hợp:
- `spec_score = ram_gb × log(1 + storage_gb)`
- `depreciation_score = age_years × (1 − condition_score/3)`
- `chip_x_age = chip_gen / (age_years + 1)`

#### Thiết kế mã hóa biến phân loại

Biến `model` có cardinality cao (hàng trăm giá trị) và là tín hiệu mạnh nhất. Sử dụng `TargetEncoder` của scikit-learn với `cv=5`, `target_type='continuous'`, nhúng trong `Pipeline` — đảm bảo mỗi fold cross-validation chỉ học encoding từ dữ liệu train của fold đó, **không rò rỉ** thông tin giá sang tập validation.

### 2.5.4. Thiết kế tích hợp vào Second Life

Module AI không hoạt động độc lập mà nằm trong luồng microservice:

```
Seller Hub → Product Service → AI Service (Flask) → XGBoost model
```

**Luồng xử lý:**
1. `POST /ai/suggest-price` (Product Service) — kiểm tra `sub-phone` + `BUY`
2. `PhonePricingRequestMapper` — chuyển `attributeLines`, `productName`, `listingTitle`… sang payload ML
3. `POST /api/v1/ai/suggest-price/phone` (AI Service) — suy luận
4. Trả `suggestedPriceVnd`, `priceMinVnd`, `priceMaxVnd`, `confidence`, `reasoningBrief`

**Cơ chế tin cậy và khoảng giá:**

| Confidence | Điều kiện | Biên độ |
|------------|-----------|---------|
| HIGH | Đủ specs + model + tuổi máy | ±18% |
| MEDIUM | Có specs + model, hoặc có text | ±22% |
| LOW | Thiếu thông tin quan trọng | ±28% |

---

# Chương 3. Triển khai hệ thống và kết quả thực nghiệm

## 3.4. Triển khai và kết quả module gợi ý giá điện thoại (AI)

### 3.4.1. Quy trình huấn luyện mô hình

Huấn luyện thực hiện trên Google Colab, notebook `aiservice/train/phone_price_pipeline_vnd_v10.ipynb`:

| Tham số | Giá trị |
|---------|---------|
| scikit-learn | 1.6.1 |
| `RANDOM_SEED` | 42 |
| Tỷ lệ test | 20% |
| Optuna trials | 50 (TPE Sampler) |
| Cross-validation | 5-fold |

Hai mô hình được so sánh: XGBoost và LightGBM. Siêu tham số tối ưu gồm `n_estimators`, `learning_rate`, `max_depth`, `subsample`, `colsample_bytree`, `reg_alpha`, `reg_lambda`, `min_child_weight`, `gamma`.

![Hình 3.4.1 — Tối ưu siêu tham số Optuna](./images/phone-pricing/figS7.png)

*Hình 3.4.1. CV R² qua từng trial của Optuna cho XGBoost và LightGBM.*

### 3.4.2. Kết quả đánh giá mô hình

**Bảng 3.4.1. So sánh mô hình trên tập kiểm thử (2.479 mẫu)**

| Mô hình | CV R² (TB ± ĐLC) | Test R² | Gap CV/Test | MAE (VND) | MAPE (%) |
|---------|------------------|---------|-------------|-----------|----------|
| **XGBoost** | 0,8301 ± 0,0135 | **0,8058** | 0,0244 | **1.810.294** | **29,4** |
| LightGBM | 0,8302 ± 0,0125 | 0,8039 | 0,0263 | 1.822.059 | 30,1 |

**Nhận xét:**
- XGBoost giải thích **80,6%** phương sai giá trên tập test.
- Gap CV/Test = 0,024 → mô hình **không overfit** đáng kể.
- MAE ≈ 1,81 triệu VND: với điện thoại tầm trung 5–15 triệu, sai số tuyệt đối ở mức chấp nhận được.
- MAPE 29,4%: phân khúc bình dân có MAPE cao hơn do giá nhỏ và biến động lớn.

![Hình 3.4.2 — Cross-validation chi tiết](./images/phone-pricing/figS8.png)

*Hình 3.4.2. R² và MAE trên từng fold của 5-fold CV.*

### 3.4.3. Phân tích chất lượng dự đoán

**Thực tế vs dự đoán:** Điểm phân tán sát đường chéo lý tưởng, đặc biệt phân khúc 5–15 triệu (Hình 3.4.3).

![Hình 3.4.3 — Actual vs Predicted](./images/phone-pricing/fig3.png)

*Hình 3.4.3. Biểu đồ phân tán giá thực tế và giá dự đoán.*

**Phân phối sai số:** APE tập trung quanh 20–25%, một số outlier ở phân khúc giá thấp (Hình 3.4.4).

![Hình 3.4.4 — Phân phối sai số](./images/phone-pricing/fig4.png)

*Hình 3.4.4. Phân phối sai số tuyệt đối phần trăm (APE).*

**Sai số theo nhóm:** Tầm trung ổn định nhất; bình dân biến động cao; flagship sai số tuyệt đối lớn nhưng % hợp lý (Hình 3.4.5).

![Hình 3.4.5 — Sai số theo phân khúc](./images/phone-pricing/fig5.png)

*Hình 3.4.5. Sai số theo phân khúc giá và hãng sản xuất.*

**Feature importance:** Top đặc trưng — `model` (qua Target Encoding), `storage_gb`, `condition_score`, `age_years`, `title_quality_score`, `chip_gen` (Hình 3.4.6).

![Hình 3.4.6 — Feature importance](./images/phone-pricing/fig6.png)

*Hình 3.4.6. 15 đặc trưng quan trọng nhất theo XGBoost.*

**Đường cong học:** R² validation ổn định từ ~60% dữ liệu trở lên, xác nhận tập 9.912 mẫu đủ cho mô hình (Hình 3.4.7).

![Hình 3.4.7 — Learning curve](./images/phone-pricing/fig7.png)

*Hình 3.4.7. R² theo kích thước tập huấn luyện.*

**Phân tích SHAP:** Tuổi máy và tình trạng tương tác ảnh hưởng giá; pin thấp và từ khóa lỗi làm giảm dự đoán — phù hợp trực giác thị trường (Hình 3.4.8, 3.4.9).

![Hình 3.4.8 — SHAP summary](./images/phone-pricing/hinh_shap_summary.png)

*Hình 3.4.8. SHAP summary plot.*

![Hình 3.4.9 — SHAP importance](./images/phone-pricing/hinh_shap_bar.png)

*Hình 3.4.9. Xếp hạng |SHAP| trung bình.*

![Hình 3.4.10 — Đánh giá tổng hợp](./images/phone-pricing/hinh_danh_gia_tong_hop.png)

*Hình 3.4.10. Tổng hợp: chỉ số, scatter, residual, feature importance.*

### 3.4.4. Triển khai dịch vụ suy luận

Sau huấn luyện, artifacts được export (`xgb_model.json`, `preprocessor.pkl`, `label_encoders.pkl`, `artifacts.json`) vào `aiservice/models/v10/`:

```
aiservice/
├── app/
│   ├── features.py     # Trích đặc trưng (đồng bộ notebook)
│   ├── predictor.py    # Nạp model + suy luận
│   └── routes.py       # /health, /api/v1/ai/suggest-price/phone
├── models/v10/         # Artifacts (mount vào Docker)
└── Dockerfile          # Gunicorn, port 8090
```

**Luồng suy luận:** validate input → `build_feature_row()` (26 features) → `preprocessor.transform()` → `XGBoost.predict(log_price)` → `expm1` → VND → tính confidence + khoảng giá → JSON response.

### 3.4.5. Tích hợp Product Service

| Thành phần | Vai trò |
|------------|---------|
| `AiController` | Endpoint `/ai/suggest-price` |
| `AiServiceImpl` | Kiểm tra `sub-phone` + `BUY`, routing |
| `PhonePricingRequestMapper` | Map Java DTO → Python payload |
| `PhonePricingClient` | HTTP call đến AI Service |

Cấu hình: `external.ai-service.url=http://ai-service:8090` trong `docker-compose.yml`.

### 3.4.6. Đánh giá module

**Ưu điểm:**
- Test R² = 0,806, MAE ≈ 1,81 triệu trên thị trường đồ cũ nhiễu
- Khai thác đồng thời specs, văn bản, metadata tin đăng
- Tích hợp production qua microservice, tách train/serve
- Target Encoding cross-fit — đánh giá trung thực

**Hạn chế:**

| Hạn chế | Hướng phát triển |
|---------|------------------|
| Chỉ điện thoại BUY | Mở rộng danh mục, hỗ trợ thuê |
| Dữ liệu Chợ Tốt | Retrain từ giao dịch Second Life |
| MAPE ~29% | Bổ sung phân tích ảnh (multi-modal) |
| Model mới (cold-start) | Embedding hoặc heuristic fallback |

---

## Danh mục hình ảnh (module AI)

| Ký hiệu | Nội dung | Tệp |
|---------|----------|-----|
| Hình 2.5.1 | Tổng quan tập dữ liệu | `images/phone-pricing/figS1.png` |
| Hình 2.5.2 | Giá theo hãng, tình trạng, khu vực | `images/phone-pricing/figS2.png` |
| Hình 2.5.3 | Tín hiệu văn bản | `images/phone-pricing/figS4.png` |
| Hình 2.5.4 | Giá theo thông số kỹ thuật | `images/phone-pricing/figS5.png` |
| Hình 2.5.5 | Ma trận tương quan | `images/phone-pricing/figS3.png` |
| Hình 2.5.6 | Khảo sát sơ bộ | `images/phone-pricing/eda_v10.png` |
| Hình 2.5.7 | Kiến trúc pipeline | `images/phone-pricing/figS6.png` |
| Hình 3.4.1 | Optuna tuning | `images/phone-pricing/figS7.png` |
| Hình 3.4.2 | CV fold detail | `images/phone-pricing/figS8.png` |
| Hình 3.4.3 | Actual vs Predicted | `images/phone-pricing/fig3.png` |
| Hình 3.4.4 | Phân phối sai số | `images/phone-pricing/fig4.png` |
| Hình 3.4.5 | Sai số theo nhóm | `images/phone-pricing/fig5.png` |
| Hình 3.4.6 | Feature importance | `images/phone-pricing/fig6.png` |
| Hình 3.4.7 | Learning curve | `images/phone-pricing/fig7.png` |
| Hình 3.4.8 | SHAP summary | `images/phone-pricing/hinh_shap_summary.png` |
| Hình 3.4.9 | SHAP bar | `images/phone-pricing/hinh_shap_bar.png` |
| Hình 3.4.10 | Đánh giá tổng hợp | `images/phone-pricing/hinh_danh_gia_tong_hop.png` |

---

## Tài liệu tham khảo kỹ thuật

| Nội dung | Đường dẫn |
|----------|-----------|
| Notebook huấn luyện | `aiservice/train/phone_price_pipeline_vnd_v10.ipynb` |
| AI Service | `aiservice/app/` |
| Tích hợp Java | `productservice/.../PhonePricingRequestMapper.java`, `AiServiceImpl.java` |
| Docker Compose | `docker-compose.yml` |
