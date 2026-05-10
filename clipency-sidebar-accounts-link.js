(function(){
  window.CLIPENCY_SIDEBAR_ACCOUNTS_LINK = "sidebar-accounts-v1";

  function clean(v){
    return String(v || "").replace(/\s+/g, " ").trim();
  }

  function isDashboardPage(){
    const p = location.pathname.replace(/\/+$/, "").toLowerCase();
    return ["/campaigns","/stats","/payouts","/wallet","/profile","/accounts"].includes(p);
  }

  function addLink(){
    if(!isDashboardPage()) return;
    if(document.querySelector('a[href="/accounts"]')) return;

    const links = Array.from(document.querySelectorAll("a"));
    const profile = links.find(a => clean(a.textContent).toLowerCase() === "profile" || clean(a.textContent).toLowerCase().includes("profile"));
    const wallet = links.find(a => clean(a.textContent).toLowerCase() === "wallet" || clean(a.textContent).toLowerCase().includes("wallet"));
    const ref = profile || wallet;

    if(!ref || !ref.parentElement) return;

    const clone = ref.cloneNode(true);
    clone.href = "/accounts";
    clone.removeAttribute("aria-current");

    clone.querySelectorAll("*").forEach(el => {
      el.removeAttribute("aria-current");
      el.classList.remove("active","selected","current");
    });

    clone.classList.remove("active","selected","current");

    function replaceText(node){
      if(node.nodeType === 3){
        node.nodeValue = node.nodeValue.replace(/Profile|Wallet/gi, "Accounts");
      }else{
        node.childNodes.forEach(replaceText);
      }
    }

    replaceText(clone);

    if(!/accounts/i.test(clean(clone.textContent))){
      clone.appendChild(document.createTextNode(" Accounts"));
    }

    if(location.pathname.replace(/\/+$/, "").toLowerCase() === "/accounts"){
      clone.classList.add("active");
      clone.setAttribute("aria-current", "page");
      clone.style.background = "rgba(224,172,120,.11)";
      clone.style.color = "#e0ac78";
      clone.style.borderColor = "rgba(224,172,120,.26)";
    }

    ref.parentElement.insertBefore(clone, profile || ref);
  }

  document.addEventListener("DOMContentLoaded", addLink);
  window.addEventListener("load", addLink);
  setTimeout(addLink, 900);
})();
