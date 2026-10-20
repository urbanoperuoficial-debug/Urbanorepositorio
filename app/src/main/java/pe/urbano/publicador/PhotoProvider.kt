package pe.urbano.publicador
import android.content.ContentProvider
import android.content.ContentValues
import android.database.Cursor
import android.net.Uri
import android.os.ParcelFileDescriptor
import java.io.File
class PhotoProvider:ContentProvider(){
 override fun onCreate()=true
 override fun getType(uri:Uri)="image/jpeg"
 override fun query(uri:Uri,projection:Array<out String>?,selection:String?,selectionArgs:Array<out String>?,sortOrder:String?):Cursor?=null
 override fun insert(uri:Uri,values:ContentValues?):Uri?=null
 override fun delete(uri:Uri,selection:String?,selectionArgs:Array<out String>?)=0
 override fun update(uri:Uri,values:ContentValues?,selection:String?,selectionArgs:Array<out String>?)=0
 override fun openFile(uri:Uri,mode:String):ParcelFileDescriptor?{
  if(mode!="r")throw SecurityException("Solo lectura")
  val name=uri.lastPathSegment?:throw java.io.FileNotFoundException()
  if(!name.matches(Regex("photo_[a-f0-9-]+\\.jpg")))throw java.io.FileNotFoundException()
  return ParcelFileDescriptor.open(File(requireNotNull(context).filesDir,name),ParcelFileDescriptor.MODE_READ_ONLY)
 }
}
