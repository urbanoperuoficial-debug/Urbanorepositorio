package pe.urbano.publicador

import android.content.Context
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.util.UUID

data class Product(val id:String, val section:Int, val text:String, val files:List<String>, val status:String="PENDIENTE",val created:Long=System.currentTimeMillis())
object Store {
 private fun file(c:Context)=File(c.filesDir,"products.json")
 fun load(c:Context):MutableList<Product> = try {
  val a=JSONArray(file(c).readText()); MutableList(a.length()){ i->
   val o=a.getJSONObject(i);val fs=o.getJSONArray("files");Product(o.getString("id"),o.getInt("section"),o.getString("text"),(0 until fs.length()).map{fs.getString(it)},o.optString("status","PENDIENTE"),o.optLong("created"))
  }
 } catch(_:Exception){ mutableListOf() }
 fun save(c:Context, items:List<Product>){ val a=JSONArray();items.forEach {p->a.put(JSONObject().put("id",p.id).put("section",p.section).put("text",p.text).put("files",JSONArray(p.files)).put("status",p.status).put("created",p.created))};file(c).writeText(a.toString()) }
 fun add(c:Context,section:Int,text:String,uris:List<Uri>){
  val paths=uris.mapNotNull {u->try {val mime=c.contentResolver.getType(u)?:"image/jpeg";val ext=when(mime){"image/png"->"png";"image/webp"->"webp";"image/heic","image/heif"->"heic";else->"jpg"};val dest=File(c.filesDir,"photo_${UUID.randomUUID()}.$ext");val input=c.contentResolver.openInputStream(u)?:return@mapNotNull null;input.use {stream->dest.outputStream().use{stream.copyTo(it)}};dest.absolutePath}catch(_:Exception){null}}
  val items=load(c);items.add(Product(UUID.randomUUID().toString(),section,text,paths));save(c,items)
 }
 fun prefs(c:Context)=c.getSharedPreferences("config",Context.MODE_PRIVATE)
}
