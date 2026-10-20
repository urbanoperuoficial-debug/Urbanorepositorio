package pe.urbano.publicador

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

object Scheduler {
 fun nextSlot(after:Long):Long {
  val c=Calendar.getInstance().apply{timeInMillis=after;set(Calendar.SECOND,0);set(Calendar.MILLISECOND,0)}
  c.set(Calendar.MINUTE,if(c.get(Calendar.MINUTE)<30)30 else 0)
  if(c.get(Calendar.MINUTE)==0)c.add(Calendar.HOUR_OF_DAY,1)
  while(true){
   val h=c.get(Calendar.HOUR_OF_DAY)
   if(h in 9..20 || h==21 && c.get(Calendar.MINUTE)==0) {
    if(c.timeInMillis>after)return c.timeInMillis
   }
   c.add(Calendar.MINUTE,30)
  }
 }
 fun schedule(c:Context){if(!Store.prefs(c).getBoolean("enabled",false))return
  val alarm=c.getSystemService(AlarmManager::class.java)
  val pi=PendingIntent.getBroadcast(c,0,Intent(c,SlotReceiver::class.java),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  val whenMs=nextSlot(System.currentTimeMillis()); Store.prefs(c).edit().putLong("next_alarm",whenMs).apply(); if(Build.VERSION.SDK_INT>=31 && alarm.canScheduleExactAlarms())alarm.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,whenMs,pi) else alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,whenMs,pi)
 }
 fun cancel(c:Context){val pi=PendingIntent.getBroadcast(c,0,Intent(c,SlotReceiver::class.java),PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE);c.getSystemService(AlarmManager::class.java).cancel(pi)}
}
class SlotReceiver:BroadcastReceiver(){override fun onReceive(c:Context,intent:Intent?){
 if(!Store.prefs(c).getBoolean("enabled",false))return
 val cal=Calendar.getInstance();val hour=cal.get(Calendar.HOUR_OF_DAY);val minute=cal.get(Calendar.MINUTE)\n // Las alarmas inexactas pueden llegar tarde; el turno se calcula desde la hora programada.
 val section=if(hour in 9..21 && (hour!=21 || minute==0) && (minute==0||minute==30)) {if(minute==0)0 else 1} else -1
 if(section>=0){val p=Store.load(c).firstOrNull{it.section==section&&it.status=="PENDIENTE"}
  if(p!=null){val nm=c.getSystemService(NotificationManager::class.java);nm.createNotificationChannel(NotificationChannel("publication","Publicaciones pendientes",NotificationManager.IMPORTANCE_HIGH))
   val launch=Intent(c,MainActivity::class.java).putExtra("product_id",p.id).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
   val pi=PendingIntent.getActivity(c,p.id.hashCode(),launch,PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
   val n=android.app.Notification.Builder(c,"publication").setSmallIcon(android.R.drawable.ic_menu_send).setContentTitle(if(section==0)"Fotos Urbano — turno" else "Foto Réplica — turno").setContentText("Producto listo para compartir por WhatsApp").setContentIntent(pi).setAutoCancel(true).build();nm.notify(p.id.hashCode(),n)
  }
 }
 Scheduler.schedule(c)
}}
class BootReceiver:BroadcastReceiver(){override fun onReceive(c:Context,i:Intent?){Scheduler.schedule(c)}}
