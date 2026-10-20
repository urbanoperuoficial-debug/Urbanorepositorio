package pe.urbano.publicador

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class AutoPublishService : AccessibilityService() {
 companion object { var active: AutoPublishService? = null }
 override fun onServiceConnected() { super.onServiceConnected(); active=this }
 override fun onDestroy() { active=null; super.onDestroy() }
 override fun onInterrupt() {}
 override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
 fun openWhatsApp() {
  val i=packageManager.getLaunchIntentForPackage("com.whatsapp")
    ?:packageManager.getLaunchIntentForPackage("com.whatsapp.w4b")
  if(i!=null) {i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);startActivity(i)}
 }
 fun visibleTexts():List<String> {
  val out=mutableListOf<String>()
  fun visit(n:AccessibilityNodeInfo?) {
   if(n==null)return
   n.text?.toString()?.takeIf{it.isNotBlank()}?.let{out.add(it)}
   n.contentDescription?.toString()?.takeIf{it.isNotBlank()}?.let{out.add(it)}
   for(j in 0 until n.childCount)visit(n.getChild(j))
  }
  visit(rootInActiveWindow)
  return out.take(100)
 }
}
