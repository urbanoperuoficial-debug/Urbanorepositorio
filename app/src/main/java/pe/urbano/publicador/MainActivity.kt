package pe.urbano.publicador

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.text.InputType
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.*
import java.io.File

class MainActivity:Activity(){
 private lateinit var root:LinearLayout
 private var section=0
 private var draftUris:List<Uri> = emptyList()
 private var draftText=""
 private var markup=0
 private var draftPrice=0
 private val navy=Color.rgb(21,35,61)
 private val blue=Color.rgb(34,92,220)
 private fun shape(color:Int,radius:Float=18f)=GradientDrawable().apply{setColor(color);cornerRadius=radius}
 private fun heading(s:String)=label(s,20f).apply{setTypeface(null,Typeface.BOLD)}
 override fun onCreate(savedInstanceState:Bundle?){super.onCreate(savedInstanceState);handleIncoming(intent);show()}
 override fun onNewIntent(intent:Intent){super.onNewIntent(intent);setIntent(intent);handleIncoming(intent);show()}
 @Suppress("DEPRECATION")
 private fun handleIncoming(i:Intent?){if(i==null)return
  draftText=i.getStringExtra(Intent.EXTRA_TEXT)?:""
  draftUris=when(i.action){
   Intent.ACTION_SEND->listOfNotNull(if(Build.VERSION.SDK_INT>=33)i.getParcelableExtra(Intent.EXTRA_STREAM,Uri::class.java) else i.getParcelableExtra<Uri>(Intent.EXTRA_STREAM))
   Intent.ACTION_SEND_MULTIPLE->if(Build.VERSION.SDK_INT>=33)i.getParcelableArrayListExtra(Intent.EXTRA_STREAM,Uri::class.java)?: emptyList() else i.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)?: emptyList()
   else->emptyList()
  }
 }
 private fun label(s:String,size:Float=16f):TextView=TextView(this).apply{text=s;textSize=size;setTextColor(Color.rgb(25,35,45));setPadding(0,12,0,12)}
 private fun button(s:String,action:()->Unit)=Button(this).apply{text=s;isAllCaps=false;textSize=14f;setTextColor(Color.WHITE);background=shape(blue,20f);setPadding(12,15,12,15);setOnClickListener{action()}}
 private fun add(v:View){root.addView(v)}
 private fun show(){root=LinearLayout(this).apply{orientation=LinearLayout.VERTICAL;setPadding(20,20,20,30);setBackgroundColor(Color.rgb(247,249,253))}
  val scroll=ScrollView(this);scroll.addView(root);setContentView(scroll)
  add(heading("URBANO  |  PUBLICADOR"));add(label("Tu centro de publicaciones",14f));add(label("Horario: 9:00 a. m. a 9:00 p. m.  ·  cada 30 min",13f))
  val tabs=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL}
  listOf("FOTOS URBANO","FOTO RÉPLICA").forEachIndexed{idx,t->tabs.addView(button(if(section==idx)"● $t" else t){section=idx;show()},LinearLayout.LayoutParams(0,-2,1f))};add(tabs)
  add(label("Importa fotografías y textos desde WhatsApp usando Compartir → URBANO Publicador. Cada cola conserva sus productos.",13f))
  val enabled=Store.prefs(this).getBoolean("enabled",false)
  add(button(if(enabled)"DETENER PROGRAMACIÓN" else "ACTIVAR PROGRAMACIÓN DIARIA"){
   if(enabled){Store.prefs(this).edit().putBoolean("enabled",false).apply();Scheduler.cancel(this)}else{Store.prefs(this).edit().putBoolean("enabled",true).apply();Scheduler.schedule(this);askNotification()};show()
  })
  val next=Store.prefs(this).getLong("next_alarm",0L)
  if(enabled&&next>0)add(label("Próximo aviso: "+SimpleDateFormat("dd/MM · hh:mm a",Locale("es","PE")).format(Date(next)),14f))
  add(button("ACTIVAR ASISTENTE DE ACCESIBILIDAD"){startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))})
  add(label(if(AutoPublishService.active!=null)"Asistente de accesibilidad: ACTIVO" else "Asistente de accesibilidad: DESACTIVADO",13f))
  add(button("PERMISOS Y NOTIFICACIONES"){permissions()})
  add(heading("Nuevo producto · ${if(section==0)"Fotos Urbano" else "Foto Réplica"}"))
  val desc=EditText(this).apply{hint="Descripción, tallas y precio";minLines=3;setText(draftText)};add(desc)
  add(label("Fotos seleccionadas: ${draftUris.size}",13f))
  if(draftUris.isNotEmpty()){val photos=HorizontalScrollView(this);val strip=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL};draftUris.take(15).forEach{uri->val img=ImageView(this).apply{setImageURI(uri);scaleType=ImageView.ScaleType.CENTER_CROP};strip.addView(img,LinearLayout.LayoutParams(180,180).apply{setMargins(0,0,12,0)})};photos.addView(strip);add(photos)}
  add(label("Aumentar precio al importar o compartir",14f))
  val priceRow=LinearLayout(this).apply{orientation=LinearLayout.HORIZONTAL}
  listOf(0,5,10,15,20).forEach{v->priceRow.addView(button(if(v==markup)"✓ +S/ $v" else "+S/ $v"){draftText=desc.text.toString();markup=v;show()},LinearLayout.LayoutParams(0,-2,1f).apply{setMargins(2,0,2,0)})};add(priceRow)
  add(button("ELEGIR FOTOS") {draftText=desc.text.toString();val i=Intent(Intent.ACTION_OPEN_DOCUMENT).apply{type="image/*";addCategory(Intent.CATEGORY_OPENABLE);putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true)};startActivityForResult(i,100)})
  add(button("GUARDAR PRODUCTO EN COLA") {val t=desc.text.toString();if(t.isBlank()&&draftUris.isEmpty()){Toast.makeText(this,"Agrega descripción o fotos",Toast.LENGTH_SHORT).show();return@button};Store.add(this,section,applyMarkup(t,markup),draftUris);draftText="";draftUris=emptyList();markup=0;show()})
  add(heading("Cola de publicaciones"))
  add(label("Pendientes: "+Store.load(this).count{it.section==section&&it.status=="PENDIENTE"}+"  ·  Enviados: "+Store.load(this).count{it.section==section&&it.status=="ENVIADO"},14f))
  val items=Store.load(this).filter{it.section==section};if(items.isEmpty())add(label("Todavía no hay productos."))
  items.forEachIndexed{index,p->
   val upcoming=if(p.status=="PENDIENTE")"Pendiente" else p.status
   add(label("${index+1}. $upcoming · ${p.files.size} foto(s)\n${p.text.take(180)}",14f))
   if(p.files.isNotEmpty()){val thumb=ImageView(this).apply{setImageURI(Uri.fromFile(File(p.files.first())));scaleType=ImageView.ScaleType.CENTER_CROP};add(thumb.apply{layoutParams=LinearLayout.LayoutParams(240,240)})}
   add(button("COMPARTIR EN WHATSAPP") {share(p)})
   add(button(if(p.status=="ENVIADO")"DEVOLVER A PENDIENTES" else "MARCAR COMO ENVIADO") {updateStatus(p,if(p.status=="ENVIADO")"PENDIENTE" else "ENVIADO")})
   add(button("ELIMINAR") {val all=Store.load(this);Store.save(this,all.filterNot{it.id==p.id});p.files.forEach{File(it).delete()};show()})
  }
  val id=intent?.getStringExtra("product_id");if(id!=null){intent.removeExtra("product_id");Store.load(this).find{it.id==id}?.let{p->section=p.section;Toast.makeText(this,"Turno listo: ${if(section==0)"Fotos Urbano" else "Foto Réplica"}",Toast.LENGTH_LONG).show()}}
 }
 private fun applyMarkup(text:String,extra:Int):String {if(extra==0)return text
  val rx=Regex("(?i)(S/\\s*)(\\d+(?:[.,]\\d{1,2})?)");return rx.replace(text){m->val n=m.groupValues[2].replace(",",".").toDoubleOrNull();if(n==null)m.value else "S/ "+(if((n+extra)%1.0==0.0)(n+extra).toInt().toString() else "%.2f".format(Locale.US,n+extra))}
 }
 private fun updateStatus(p:Product,s:String){Store.save(this,Store.load(this).map{if(it.id==p.id)it.copy(status=s)else it});show()}
 private fun share(p:Product){
  val uris=p.files.map{path->val file=File(path); Uri.parse("content://${packageName}.shared/${file.name}")}
  val i=Intent(if(uris.size>1)Intent.ACTION_SEND_MULTIPLE else Intent.ACTION_SEND).apply{
   type=if(uris.isEmpty())"text/plain" else "image/*";putExtra(Intent.EXTRA_TEXT,p.text)
   if(uris.size>1)putParcelableArrayListExtra(Intent.EXTRA_STREAM,ArrayList(uris)) else if(uris.size==1)putExtra(Intent.EXTRA_STREAM,uris[0])
   addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
   if(uris.isNotEmpty()){val clip=android.content.ClipData.newUri(contentResolver,"Fotos URBANO",uris.first());uris.drop(1).forEach{clip.addItem(android.content.ClipData.Item(it))};clipData=clip}
  };startActivity(Intent.createChooser(i,"Compartir producto"))
 }
 @Suppress("DEPRECATION")
 override fun onActivityResult(requestCode:Int,resultCode:Int,data:Intent?){super.onActivityResult(requestCode,resultCode,data);if(requestCode==100&&resultCode==RESULT_OK){draftUris=if(data?.clipData!=null)(0 until data.clipData!!.itemCount).map{data.clipData!!.getItemAt(it).uri}else listOfNotNull(data?.data);show()}}
 private fun askNotification(){if(Build.VERSION.SDK_INT>=33&&checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED)requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS),11)}
 private fun permissions(){val options=arrayOf("Notificaciones","Alarmas exactas","Optimización de batería")
  android.app.AlertDialog.Builder(this).setTitle("Permisos Android").setItems(options){_,which->
   val action=when(which){0->Settings.ACTION_APP_NOTIFICATION_SETTINGS;1->if(Build.VERSION.SDK_INT>=31)Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM else Settings.ACTION_APPLICATION_DETAILS_SETTINGS;2->Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS;3->Settings.ACTION_MANAGE_OVERLAY_PERMISSION;else->Settings.ACTION_APPLICATION_DETAILS_SETTINGS}
   try{startActivity(Intent(action).apply{if(which==0)putExtra(Settings.EXTRA_APP_PACKAGE,packageName);if(which==1||which==3)data=Uri.parse("package:$packageName")})}catch(_:Exception){Toast.makeText(this,"No disponible en este Android",Toast.LENGTH_SHORT).show()}
  }.show()
 }
}
