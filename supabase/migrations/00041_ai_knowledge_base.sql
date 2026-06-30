create table if not exists public.ai_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  keywords text[] not null default '{}',
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_knowledge_base_active_priority_idx
  on public.ai_knowledge_base (is_active, priority desc);

create index if not exists ai_knowledge_base_category_idx
  on public.ai_knowledge_base (category);

drop trigger if exists ai_knowledge_base_set_updated_at on public.ai_knowledge_base;
create trigger ai_knowledge_base_set_updated_at
before update on public.ai_knowledge_base
for each row execute function public.set_updated_at();

alter table public.ai_knowledge_base enable row level security;

revoke all on table public.ai_knowledge_base from anon;
revoke all on table public.ai_knowledge_base from authenticated;
grant select, insert, update, delete on table public.ai_knowledge_base to service_role;

insert into public.ai_knowledge_base (category, question, answer, keywords, priority)
values
('kurumsal', 'Nizamiye Medresesi nedir?', 'Nizamiye Medresesi, Muhammet Şevket Gökşan hocamızın önderliğinde kurulan; ilim, ahlak ve disiplin merkezli eğitim anlayışıyla talebelerine medrese geleneği içinde rehberlik eden bir eğitim kurumudur.', array['nizamiye','medrese','kurum','nedir','hakkında','muhammet şevket gökşan','şevket hoca'], 170),
('kurumsal', 'Nizamiye Medresesi kim tarafından kurulmuştur?', 'Nizamiye Medresesi, Muhammet Şevket Gökşan hocamızın önderliğinde kurulmuştur.', array['kurucu','kim kurdu','kim tarafından','kuruluş','muhammet şevket gökşan','şevket hoca'], 170),
('kurumsal', 'Nizamiye Medresesi ne zaman kurulmuştur?', 'Nizamiye Medresesi, Muhammet Şevket Gökşan hocamızın önderliğinde kurulmuş bir eğitim kurumudur. Kuruluş tarihine ilişkin resmi detaylar için kurum yönetiminin güncel açıklamaları esas alınmalıdır.', array['ne zaman','kuruluş tarihi','tarihçe','muhammet şevket gökşan','şevket hoca'], 125),
('kurumsal', 'Nizamiye Medresesi hangi ilde bulunmaktadır?', 'Nizamiye Medresesi Erzurum merkezli bir eğitim kurumudur.', array['hangi il','nerede','erzurum','konum','adres'], 150),
('kurumsal', 'Nizamiye Medresesi iletişim bilgileri nedir?', 'Nizamiye Medresesi iletişim bilgileri için kurum yönetimi veya öğrenci işleriyle iletişime geçilmelidir. Sistem içinde kayıtlı bilgiler yetkiniz dahilindeyse ilgili ekranlardan görüntülenebilir.', array['iletişim','telefon','adres','ulaşım'], 120),
('kurumsal', 'Nizamiye Medresesi resmi bir kurum mudur?', 'Nizamiye Medresesi kurum içi eğitim, takip ve öğrenci yönetimi süreçlerini Nizamiye OYBS üzerinden yürüten bir eğitim kurumudur. Resmi statüyle ilgili ayrıntılar için kurum yönetimi esas alınmalıdır.', array['resmi','statü','kurum'], 110),
('kurumsal', 'Nizamiye Medresesi hakkında kısa bilgi verir misin?', 'Nizamiye Medresesi, Muhammet Şevket Gökşan hocamızın önderliğinde kurulan; talebelerin dini, ahlaki ve akademik gelişimini düzenli takip eden, medrese geleneğini disiplinli eğitim anlayışıyla sürdüren bir kurumdur.', array['kısa bilgi','kurum hakkında','özet','tanıtım','muhammet şevket gökşan','şevket hoca'], 160),
('kurumsal', 'Nizamiye Medresesi hangi değerlere önem verir?', 'Nizamiye Medresesi ilim, edep, disiplin, sorumluluk, güvenilirlik ve istikrarlı öğrenci takibini temel değerler arasında görür.', array['değerler','edep','disiplin','ilim','ahlak'], 125),
('kurumsal', 'Nizamiye Medresesi güvenli mi?', 'Nizamiye Medresesi talebelerin güvenliği, düzenli takibi ve kurum içi disiplinin korunması için öğrenci, yatakhane, yoklama ve rehberlik süreçlerini takip eder.', array['güvenli','güvenlik','takip'], 120),
('kurumsal', 'Nizamiye Medresesi kimlere eğitim verir?', 'Nizamiye Medresesi, kurum kabul şartlarını sağlayan talebelere medrese eğitim anlayışıyla eğitim ve rehberlik desteği verir.', array['kimlere','öğrenci','talebe','kabul'], 120),
('kurumsal', 'Nizamiye nedir?', 'Nizamiye, Muhammet Şevket Gökşan hocamızın önderliğinde kurulan Nizamiye Medresesi çatısı altında; ilim, ahlak ve disiplin merkezli eğitim anlayışıyla talebelerine rehberlik eden bir eğitim kurumudur.', array['nizamiye nedir','nizamiye','medrese nedir','muhammet şevket gökşan','şevket hoca'], 168),
('kurumsal', 'Medrese hakkında bilgi ver', 'Nizamiye Medresesi, Muhammet Şevket Gökşan hocamızın önderliğinde kurulan; medrese geleneğini ilim, ahlak, edep ve disiplinle sürdüren bir eğitim kurumudur.', array['medrese hakkında','kurum hakkında','bilgi ver','muhammet şevket gökşan','şevket hoca'], 166),
('kurumsal', 'Nizamiye Medresesi hakkında bilgi verir misin?', 'Nizamiye Medresesi, Muhammet Şevket Gökşan hocamızın önderliğinde kurulan; talebelerine ilim, ahlak ve disiplin merkezli eğitim anlayışıyla rehberlik eden, medrese geleneğini yaşatan bir eğitim kurumudur.', array['nizamiye medresesi hakkında','bilgi verir misin','kurum hakkında','muhammet şevket gökşan','şevket hoca'], 166),
('kurumsal', 'Kurum hakkında bilgi ver', 'Kurumumuz Nizamiye Medresesi, Muhammet Şevket Gökşan hocamızın önderliğinde kurulan; ilim, ahlak, edep ve disiplin merkezli eğitim anlayışıyla talebelerine rehberlik eden bir medrese eğitim kurumudur.', array['kurum hakkında','kurum bilgisi','nizamiye kurumu','muhammet şevket gökşan','şevket hoca'], 164),
('kurumsal', 'Nizamiye Medresesi kurucusu kimdir?', 'Nizamiye Medresesi''nin kurucusu Muhammet Şevket Gökşan hocamızdır.', array['kurucusu kim','kurucu kimdir','kim kurdu','muhammet şevket gökşan','şevket hoca'], 175),
('kurumsal', 'Nizamiye Medresesi''ni kim kurdu?', 'Nizamiye Medresesi, Muhammet Şevket Gökşan hocamız tarafından kurulmuştur.', array['kim kurdu','kim tarafından kuruldu','kurucu','muhammet şevket gökşan','şevket hoca'], 175),
('kurumsal', 'Muhammet Şevket Gökşan kimdir?', 'Muhammet Şevket Gökşan hocamız, Nizamiye Medresesi''nin kuruluşuna önderlik eden ve kurumun ilim, ahlak ve disiplin merkezli eğitim anlayışında adı geçen hocamızdır.', array['muhammet şevket gökşan','şevket gökşan','şevket hoca','kimdir'], 165),
('eğitim', 'Nizamiye Medresesi''nin amacı nedir?', 'Nizamiye Medresesi''nin amacı talebelerin ilmi, ahlaki ve sosyal gelişimini düzenli takip ederek nitelikli, sorumluluk sahibi bireyler yetiştirmektir.', array['amaç','hedef','neden'], 150),
('eğitim', 'Nizamiye Medresesi''nin misyonu nedir?', 'Nizamiye Medresesi''nin misyonu; ilim ve ahlakı birlikte merkeze alan, talebeyi bireysel gelişimiyle takip eden düzenli bir eğitim ortamı sunmaktır.', array['misyon','görev','eğitim anlayışı'], 150),
('eğitim', 'Nizamiye Medresesi''nin vizyonu nedir?', 'Nizamiye Medresesi''nin vizyonu; köklü medrese geleneğini güncel takip ve yönetim araçlarıyla destekleyerek örnek bir eğitim kurumu olmaktır.', array['vizyon','gelecek','hedef'], 150),
('eğitim', 'Eğitim anlayışınız nedir?', 'Nizamiye Medresesi eğitim anlayışı; ilim, edep, disiplin, düzenli takip, rehberlik ve veli iletişimini birlikte ele alan bütüncül bir yaklaşıma dayanır.', array['eğitim anlayışı','nasıl eğitim','metot','yaklaşım'], 150),
('eğitim', 'Hangi dersler okutuluyor?', 'Dersler ve sınıf bazlı programlar dönem ve sınıf atamalarına göre değişebilir. Yetkiniz varsa ders sistemi ve eğitim planlama ekranlarından güncel dersleri görebilirsiniz.', array['dersler','müfredat','program','okutulan ders'], 120),
('eğitim', 'Ders programı var mı?', 'Evet. Ders programı Nizamiye OYBS içinde eğitim planlama modülü üzerinden sınıf ve ders atamalarına göre takip edilebilir.', array['ders programı','program','haftalık'], 130),
('eğitim', 'Talebe başarısı nasıl takip edilir?', 'Talebe başarısı notlar, kanaat değerlendirmeleri, yoklama, rehberlik kayıtları ve öğretmen gözlemleriyle birlikte takip edilir.', array['başarı','not','kanaat','takip'], 135),
('eğitim', 'Not sistemi nasıl çalışır?', 'Not sistemi; aktif dönem, ders, sınav türü ve sınıf/öğrenci seçimine göre not girişini sağlar. Yetkili hocalar kendi dersleri için not girebilir.', array['not sistemi','not girişi','sınav','puan'], 130),
('eğitim', 'Kanaat sistemi nedir?', 'Kanaat sistemi, talebenin akademik performansının yanında davranış, devam, disiplin ve genel gelişim gibi alanlarda değerlendirilmesini sağlar.', array['kanaat','değerlendirme','davranış'], 125),
('eğitim', 'Yoklama takibi yapılıyor mu?', 'Evet. Yoklama modülüyle günlük veya tanımlı yoklama türlerine göre talebe devam durumu takip edilebilir.', array['yoklama','devamsızlık','devam'], 135),
('eğitim', 'Sınıf hocası ne yapar?', 'Sınıf hocası, sorumlu olduğu sınıftaki talebelerin genel takibi, iletişimi ve eğitim süreçlerinin düzenli izlenmesine destek olur.', array['sınıf hocası','sorumlu hoca','takip'], 115),
('eğitim', 'Ders hocası ne yapar?', 'Ders hocası, kendisine atanmış ders ve sınıflarda eğitim sürecini yürütür; yetkisi dahilinde not ve yoklama işlemlerine katılır.', array['ders hocası','hoca','öğretmen'], 115),
('eğitim', 'Aktif dönem nedir?', 'Aktif dönem, not ve dönemsel takip işlemlerinin yürütüldüğü geçerli akademik dönemdir. Kapalı dönemlerde not girişi yapılamaz.', array['aktif dönem','dönem','kapalı dönem'], 130),
('eğitim', 'Kapalı dönemde işlem yapılır mı?', 'Kapalı dönemlerde dönemsel kayıtlar salt okunur kabul edilir; not girişi gibi düzenleyici işlemler engellenir.', array['kapalı dönem','arşiv','salt okunur'], 130),
('eğitim', 'Öğrenci gelişimi nasıl izlenir?', 'Öğrenci gelişimi; notlar, kanaatler, devamsızlık, rehberlik görüşmeleri, revir kayıtları ve öğretmen notları birlikte değerlendirilerek izlenir.', array['öğrenci gelişimi','talebe gelişimi','izleme'], 130),
('yatakhane', 'Nizamiye Medresesi yatılı eğitim veriyor mu?', 'Evet. Nizamiye Medresesi yatılı eğitim ve yatakhane süreçlerini kurum düzeni içinde takip eder.', array['yatılı','yatakhane','pansiyon','kalıyor mu'], 150),
('yatakhane', 'Yatakhane takibi nasıl yapılır?', 'Yatakhane takibi, talebelerin yatakhane yerleşimleri ve aktif atamaları üzerinden Nizamiye OYBS içinde izlenir.', array['yatakhane takibi','yerleşim','oda'], 130),
('yatakhane', 'Yatakhane kapasitesi takip ediliyor mu?', 'Evet. Yatakhane kapasitesi ve aktif yerleşimler sistem üzerinden takip edilebilir.', array['kapasite','yatakhane kapasitesi','kontenjan'], 125),
('yatakhane', 'Talebe yatakhane bilgisi nereden görülür?', 'Yetkiniz varsa talebe profili veya yatakhane modülü üzerinden talebenin yatakhane bilgileri görüntülenebilir.', array['talebe yatakhane','nerede kalıyor','yatakhane bilgisi'], 125),
('yatakhane', 'Yatakhane değişikliği yapılabilir mi?', 'Yatakhane değişiklikleri yetkili kullanıcılar tarafından kurum kurallarına göre sistem üzerinden yönetilebilir.', array['yatakhane değişikliği','taşıma','yer değiştirme'], 110),
('rehberlik', 'Rehberlik hizmeti var mı?', 'Evet. Nizamiye Medresesi talebelerin akademik, sosyal ve kişisel gelişimini desteklemek için rehberlik süreçlerini takip eder.', array['rehberlik','danışmanlık','psikolojik destek'], 150),
('rehberlik', 'Rehberlik görüşmesi nedir?', 'Rehberlik görüşmesi, talebenin gelişimi, ihtiyaçları ve takip planları için rehberlik birimi tarafından yapılan kayıtlı görüşmedir.', array['görüşme','rehberlik görüşmesi','takip'], 130),
('rehberlik', 'Veliler rehberlik bilgilerini görebilir mi?', 'Rehberlik kayıtlarının görünürlüğü kayıt türü ve yetkilere bağlıdır. Özel veya gizli kayıtlar sadece yetkili kişiler tarafından görülebilir.', array['veli rehberlik','gizlilik','özel kayıt'], 125),
('rehberlik', 'Takip planı nedir?', 'Takip planı, rehberlik görüşmesi sonrası belirlenen aksiyonların tarih ve sorumlu bilgisiyle izlenmesini sağlar.', array['takip planı','aksiyon','rehberlik takibi'], 125),
('rehberlik', 'Rehberlik anketleri var mı?', 'Evet. Rehberlik modülü üzerinden anketler oluşturulabilir, sonuçlar yetki kapsamına göre takip edilebilir.', array['anket','rehberlik anketi','sonuçlar'], 120),
('rehberlik', 'Öğrenci sosyal durumu takip edilir mi?', 'Evet. Rehberlik süreçlerinde talebenin sosyal, akademik ve duygusal durumu yetki kapsamına göre takip edilebilir.', array['sosyal durum','duygusal durum','akademik durum'], 120),
('veli', 'Veliler bilgi alabilir mi?', 'Evet. Veliler, kendilerine tanımlı veli paneli ve kurum iletişim kanalları üzerinden yetkileri dahilinde bilgi alabilir.', array['veli','veliler','bilgi alma','veli paneli'], 150),
('veli', 'Veli paneli ne işe yarar?', 'Veli paneli, velilerin kendilerine bağlı talebelerle ilgili kurumun izin verdiği bilgileri takip edebilmesi için kullanılır.', array['veli paneli','veli girişi','ebeveyn'], 135),
('veli', 'Veli talebesinin notlarını görebilir mi?', 'Veli görünürlüğü kurumun yetki ayarlarına bağlıdır. Yetki verilen bilgiler veli panelinde gösterilir.', array['veli not','notları görme','talebe notu'], 120),
('veli', 'Veli devamsızlık bilgisini görebilir mi?', 'Devamsızlık bilgisinin veliye gösterimi kurum yetki ve paylaşım ayarlarına bağlıdır.', array['veli devamsızlık','yoklama bilgisi','devam'], 115),
('veli', 'Veli ile iletişim nasıl sağlanır?', 'Veli iletişimi, kurumun belirlediği iletişim kanalları ve sistemde kayıtlı veli bilgileri üzerinden yürütülür.', array['veli iletişim','telefon','bilgilendirme'], 115),
('veli', 'Veliler anket doldurabilir mi?', 'Evet. Kurum tarafından açılan veliye uygun anketler varsa veli paneli üzerinden katılım sağlanabilir.', array['veli anket','anket doldurma','katılım'], 115),
('sistem_kullanimi', 'Nizamiye OYBS nedir?', 'Nizamiye OYBS, öğrenci, sınıf, ders, not, yoklama, rehberlik, yatakhane, kütüphane ve yönetim süreçlerinin takip edildiği öğrenci bilgi sistemidir.', array['oybs','sistem','öğrenci bilgi sistemi'], 150),
('sistem_kullanimi', 'Nizam Aİ nedir?', 'Nizam Aİ, Nizamiye OYBS içinde kullanıcılara yetkileri dahilinde sistem verileri ve kurum bilgileri hakkında yardımcı olan dijital asistandır.', array['nizam ai','nizam ai nedir','yapay zeka','asistan'], 150),
('sistem_kullanimi', 'Nizam Aİ hangi bilgilere cevap verir?', 'Nizam Aİ, yetkiniz dahilindeki sistem verileri ile kurum tarafından tanımlı bilgi bankasındaki kurumsal sorulara cevap verebilir.', array['nizam ai cevap','hangi bilgi','asistan yetki'], 130),
('sistem_kullanimi', 'Sistemde yetkim yoksa ne olur?', 'Yetkiniz olmayan modül veya veri için işlem yapılamaz. Gerekli yetki için kurum yöneticinizle veya yetkili birimle iletişime geçmelisiniz.', array['yetki yok','erişim yok','izin'], 130),
('sistem_kullanimi', 'Şifremi unuttum ne yapmalıyım?', 'Şifre işlemleri için kurum yöneticisi veya yetkili kullanıcı yönetimi birimiyle iletişime geçmelisiniz.', array['şifre','parola','giriş yapamıyorum'], 125),
('sistem_kullanimi', 'Öğrenci bilgileri nereden güncellenir?', 'Yetkiniz varsa talebe detay veya düzenleme ekranlarından öğrenci bilgileri güncellenebilir.', array['öğrenci güncelle','talebe düzenle','bilgi güncelleme'], 120),
('sistem_kullanimi', 'Raporlar nereden alınır?', 'Raporlar modülü üzerinden yetkiniz dahilindeki sınıf, bölüm, not, yoklama ve diğer raporları görüntüleyebilirsiniz.', array['rapor','pdf','çıktı','raporlar'], 120),
('sistem_kullanimi', 'Arşiv merkezi nedir?', 'Arşiv merkezi, yetkili kullanıcıların dönem veya kapsam bazlı arşiv çıktıları oluşturup takip edebilmesi için kullanılır.', array['arşiv','export','arşiv merkezi'], 115),
('sistem_kullanimi', 'Canlı oturumlar nedir?', 'Canlı oturumlar modülü, kurum içi toplantı, seminer veya özel etkinliklerin çevrim içi planlanması ve takibi için kullanılır.', array['canlı oturum','toplantı','seminer','online'], 115),
('sistem_kullanimi', 'Kütüphane modülü ne işe yarar?', 'Kütüphane modülü kitap, kategori, emanet ve doküman süreçlerinin takip edilmesi için kullanılır.', array['kütüphane','kitap','emanet','doküman'], 115),
('sistem_kullanimi', 'Revir modülü ne işe yarar?', 'Revir modülü talebelerin sağlık kayıtlarının yetki kapsamında takip edilmesi için kullanılır.', array['revir','sağlık','hastalık','tedavi'], 115),
('sistem_kullanimi', 'Görev yönetimi nedir?', 'Görev yönetimi, kurum içi işlerin sorumlu, öncelik, durum ve tarih bilgileriyle takip edilmesini sağlar.', array['görev','iş takibi','task'], 110),
('sistem_kullanimi', 'Talep yönetimi nedir?', 'Talep yönetimi, birimler arası istek ve taleplerin oluşturulması, değerlendirilmesi ve sonuçlandırılması için kullanılır.', array['talep','istek','talep yönetimi'], 110);
