# Stabilization Backlog

Bu backlog, yeni ozellik gelistirmekten cok mevcut degisiklik setini canliya hazir hale getirmeye yoneliktir.

## Kritik

- Auth ve rol bazli erisimlerin gercek Supabase projesinde rol rol test edilmesi
- Tum migrationlarin temiz veritabaninda sirali uygulanabildiginin dogrulanmasi
- Storage bucket ve upload/read policy'lerinin gercek upload senaryosuyla test edilmesi
- Kritik form akislarinin smoke test ile dogrulanmasi
- Aktif profili olmayan kullanici davranisinin gercek ortamda dogrulanmasi
- Canli env degiskenlerinin dogru projeye baktiginin teyidi

## Onemli

- `README.md` ve operasyonel dokumanlarin ekip kullanimi icin yeterli hale getirilmesi
- Buyuk degisiklik setinin mantikli commit bloklarina ayrilmasi
- Rol bazli route gezisi yapilarak yonlendirme davranisinin kontrol edilmesi
- Hata mesajlarinin kritik akislarda kullanici icin yeterince acik olup olmadiginin gozden gecirilmesi
- Veli paneli read-only davranisinin manuel test ile teyidi

## V2'ye Kalabilir

- Raporlar modulu icin daha derin fonksiyonel test senaryolari
- Ayarlar ve duyurular ekranlarinin is akislarinin genisletilmesi
- Daha kapsamli UI polish ve mikro duzeltmeler
- PDF ciktisi icin capraz tarayici davranis testleri

## Teknik Borc

- `middleware.ts` kullaniminin Next.js 16 dokumani isiginda `proxy.ts` gecisi acisindan yeniden degerlendirilmesi
- Otomatik test kapsaminin bulunmamasi; en az kritik action ve query katmanlari icin test stratejisi tanimlanmasi
- Git gecmisinin tek buyuk degisiklik yigi halinde kalmasi
- Varsayilan `README` yapisindan gercek operasyon rehberine yeni geciliyor olmasi
- RLS stratejisinin tablo bazli daha acik dokumante edilmesi
