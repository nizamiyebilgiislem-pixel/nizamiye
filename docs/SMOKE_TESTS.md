# Smoke Tests

Bu belge, canliya cikis oncesi manuel smoke test senaryolarini moduller bazinda listeler.

## 1. Login / Logout

### On kosul

- Supabase Auth aktif
- En az bir aktif admin profili var

### Adimlar

1. `/login` ekranini ac
2. Gecerli admin kullanicisi ile giris yap
3. Panel ana ekranina yonlendirildigini kontrol et
4. Cikis yap

### Beklenen sonuc

- Login basarili olur
- Kullanici rolune uygun varsayilan ekrana gider
- Logout sonrasi oturum kapanir ve kullanici login ekranina doner

## 2. Admin Dashboard

### On kosul

- Admin rolunde aktif kullanici ile oturum acik
- Sistemde en az birkac ornek kayit var

### Adimlar

1. `/dashboard` ekranina git
2. Kartlarin, listelerin ve dagilim alanlarinin yuklendigini kontrol et
3. Sayfayi yenile

### Beklenen sonuc

- Dashboard 200 ile acilir
- Gercek veri bloklari bos hata durumuna dusmez
- Sayfa yenilemede auth veya veri yukleme hatasi vermez

## 3. Bolum Olusturma

### On kosul

- Admin veya yetkili yonetici oturumu acik

### Adimlar

1. `/bolumler/yeni` ekranina git
2. Gecerli bilgilerle bolum olustur
3. Listeye geri don

### Beklenen sonuc

- Bolum basariyla kaydedilir
- Yeni bolum listede gorunur
- Yetkisiz kullanici ayni ekrana giremez

## 4. Sinif Olusturma

### On kosul

- Sistemde en az bir bolum var
- Yetkili kullanici oturumu acik

### Adimlar

1. `/siniflar/yeni` ekranina git
2. Bir bolume bagli sinif olustur
3. Sinif detay ekranini ac

### Beklenen sonuc

- Sinif kaydi basarili olur
- Bolum iliskisi dogru kaydolur
- Detay ekraninda sinif bilgileri gorunur

## 5. Hoca Olusturma

### On kosul

- Yetkili kullanici oturumu acik
- En az bir bolum var

### Adimlar

1. `/hocalar/yeni` ekranina git
2. Gecerli bilgilerle hoca olustur
3. Listeye geri don

### Beklenen sonuc

- Hoca kaydi basarili olur
- Liste ve detay ekranlarinda yeni kayit gorunur

## 6. Talebe Olusturma

### On kosul

- Yetkili kullanici oturumu acik
- En az bir bolum ve sinif var

### Adimlar

1. `/talebeler/yeni` ekranina git
2. Zorunlu alanlari doldur
3. Kaydi tamamla
4. Talebe detay ekranini ac

### Beklenen sonuc

- Talebe kaydi basarili olur
- Liste ve detay ekranlarinda kayit gorunur
- Sinif ve bolum iliskileri dogru gorunur

## 7. Fotograf Upload

### On kosul

- `student-photos` ve `profile-photos` bucket'lari hazir
- Upload policy'leri aktif

### Adimlar

1. Talebe veya profil duzenleme formunu ac
2. Gecerli bir `jpg`, `png` veya `webp` dosyasi sec
3. Formu kaydet
4. Onizleme veya ilgili avatar alanini kontrol et

### Beklenen sonuc

- Upload basarili olur
- Public URL kaydedilir
- Fotograf ilgili ekranda gorunur
- Policy hatasi varsa kullanici sessiz basarisizlik yerine acik hata gorur

## 8. Ders Olusturma

### On kosul

- Yetkili kullanici oturumu acik

### Adimlar

1. `/not-sistemi/dersler/yeni` ekranina git
2. Gecerli bilgilerle ders olustur
3. Dersler listesine don

### Beklenen sonuc

- Ders kaydi basarili olur
- Listeye yeni ders eklenir

## 9. Sinifa Ders Atama

### On kosul

- En az bir sinif ve bir ders var
- Yetkili kullanici oturumu acik

### Adimlar

1. `/egitim-planlama/ders-atamalari` ekranina git
2. Bir sinif sec
3. Bir veya daha fazla dersi sinifa ata

### Beklenen sonuc

- Atama basarili olur
- Sayfa yenilendiginde atama korunur
- Permission veya `42501` hatasi alinmaz

## 10. Derse Hoca Atama

### On kosul

- En az bir hoca, sinif ve ders atamasi var

### Adimlar

1. Ders atama veya ilgili planlama ekranini ac
2. Bir derse hoca sec
3. Kaydet

### Beklenen sonuc

- Secilen hoca ilgili ders kaydina baglanir
- Yeniden acildiginda secim korunur

## 11. Ders Programi Olusturma

### On kosul

- Sinifin en az bir ders atamasi var

### Adimlar

1. `/egitim-planlama/ders-programi` ekranina git
2. Bir sinif sec
3. Haftalik program slotlarini doldur
4. Kaydet

### Beklenen sonuc

- Program kaydi basarili olur
- Sayfa yeniden acildiginda slotlar korunur

## 12. Not Girisi

### On kosul

- Aktif veya secilebilir bir donem var
- Sinifa bagli ders ve ogrenci kayitlari mevcut

### Adimlar

1. `/not-sistemi/not-girisi` ekranina git
2. Bir ogrenci sec
3. Not alanlarini doldur
4. Kaydet

### Beklenen sonuc

- Notlar basariyla kaydolur
- Yanlis donem parametresinde sistem uygun doneme duser
- Ders bazli varsayilan not alanlari gorunur

## 13. Kanaat Girisi

### On kosul

- Ogrenci ve donem verisi mevcut
- Yetkili kullanici oturumu acik

### Adimlar

1. `/kanaat-sistemi/kanaat-girisi` ekranina git
2. Ogrenci sec
3. Kanaat alanlarini doldur
4. Kaydet

### Beklenen sonuc

- Kanaat kaydi basarili olur
- Mevcut kayitlar tekrar acildiginda gorunur

## 14. Revir Kaydi

### On kosul

- En az bir ogrenci var

### Adimlar

1. `/revir/yeni` veya ogrenci bazli yeni revir kaydi ekranina git
2. Gecerli alanlari doldur
3. Kaydet
4. Revir kayitlari ekranini kontrol et

### Beklenen sonuc

- Revir kaydi olusur
- Ogrenci profili ve revir listesinde gorunur

## 15. Evrak Ekleme

### On kosul

- En az bir ogrenci var

### Adimlar

1. `/evraklar/yeni` veya ogrenci bazli yeni evrak ekranina git
2. Gecerli alanlari doldur
3. Kaydet
4. Liste ve detay ekranlarini kontrol et

### Beklenen sonuc

- Evrak kaydi olusur
- Liste ve detay ekranlari yeni kaydi gosterir

## 16. Veli Paneli Read-Only Kontrol

### On kosul

- `veli` rolunde bir kullanici ve `parent_student_links` iliskisi mevcut

### Adimlar

1. Veli kullanicisi ile giris yap
2. `/veli` ekranina git
3. Bagli ogrenci verilerini kontrol et
4. Veri degistirmeye yarayan bir aksiyon olup olmadigina bak

### Beklenen sonuc

- Veli yalnizca kendi bagli ogrencilerini gorur
- Ekran salt okunur davranir
- Yonetici ekranlarina erisim saglanmaz
