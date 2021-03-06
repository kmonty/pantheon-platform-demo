App = Ember.Application.create();
App.env = "";
var maxWidth = 1200;
// Directory above webroot, please use trailing slash.
var install_dir = "platform/";

// Redirect to the proper page on first page load.
if (!window.location.hash) {
  window.location = "index.html#/diagram/basic";
}

var _marketing = {
    'edgeserver'   :["Pantheon's Edge", "The edge has a built-in, ultra-fast cache that's automatically enabled for every site. It improves page load times for our customers and helps sites to cruise through viral traffic spikes without breaking a sweat."],
    'appserver'    :["Application Container", "The essence of a runtime container is a highly tuned PHP-FPM worker and its connections to the outside world. Incoming requests come via an nginx web server which handles requests for static assets, and passes dynamic requests to PHP."],
    'dbserver'     :["Database Server","The Database Service uses MariaDB and a container architecture similar to the Runtime Matrix to provision DBs and perform workflow operations. Instead of scaling via load-balancing, the DB layer can provide redundancy and horizontal scalability by supporting a self-healing replication topology, which is managed automatically."],
    'slavedbserver':["Failover Database Server(Replica)","The Database Service uses MariaDB and a container architecture similar to the Runtime Matrix to provision DBs and perform workflow operations. Instead of scaling via load-balancing, the DB layer can provide redundancy and horizontal scalability by supporting a self-healing replication topology, which is managed automatically."],
    'cacheserver'  :["Redis","Available for your applications to use in order to speed up processing."],
    'fileserver'   :["Pantheon File System","Our PFS (Pantheon File System) is a breakthrough in network-attached storage. It is backed by a self-healing elastic cluster architecture, and its advanced FUSE client rivals local on-disk filesystems for performance, thanks to a thoroughly modern leveldb caching layer."],
    'newrelic'     :["New Relic APM","It’s about gaining actionable, real-time business insights from the billions of metrics your software is producing, including user click streams, mobile activity, end user experiences and transactions.<img src='img/newrelic-graph.png'>"],
    'indexserver'  :["Apache Solr™","The popular, blazing fast open source enterprise search platform from the Apache Lucene project. Its major features include powerful full-text search, hit highlighting, faceted search, near real-time indexing, dynamic clustering, database integration, rich document (e.g., Word, PDF) handling, and geospatial search."],
    'codeserver'   :["Git Version Control","Git is a free and open source distributed version control system designed to handle everything from small to very large projects with speed and efficiency."]
};
//Only one route for this application
App.Router.map(function() {
  this.resource('diagram', { path: 'diagram/:env_id' });
});

App.IndexRoute = Ember.Route.extend({
  beforeModel: function() {
    this.transitionTo('diagram');
  }
});

App.DiagramRoute = Ember.Route.extend({
  model: function(params){
    return new Ember.RSVP.Promise(function(resolve){
      App.env = params.env_id;
      var target = "data/servers.json"
      //load the hard coded site plans.
      // Note: there are no site plans for dev/test/live locally.
      if(App.env == 'elite'){
        target = install_dir + "data/elite.json";
      }
      else if(App.env == 'elitemax'){
        target = install_dir + "data/elitemax.json";
      }
      else if(App.env == 'basic'){
        target = install_dir + "data/basic.json";
      }
      else if(App.env == 'performancesmall'){
        target = install_dir + "data/performancesmall.json";
      }
      else if(App.env == 'performancemedium'){
        target = install_dir + "data/performancemedium.json";
      }
      else if(App.env == 'performancelarge'){
        target = install_dir + "data/performancelarge.json";
      }
      else if(App.env == 'performancexl'){
        target = install_dir + "data/performancexl.json";
      }
      else if(App.env == 'multiplesites'){
        target = install_dir + "data/multiplesites.json";
      }
      else if(App.env == 'disaster'){
        target = install_dir + "data/disaster.json";
      }
      //load the actual site based on the environment selected
      $.get("/"+target+"?env="+params.env_id, function(d){
      if(!App.mySite){
          App.mySite = new Site();
        }
        App.mySite.load(d.servers);
        resolve(App.mySite);
        if(App.poller){
          clearInterval(App.poller);
        }
        //Poll the API using index.php every 2 seconds
        App.poller = window.setInterval(function(){
          $.get("/"+target+"?env="+params.env_id, function(d){
            App.mySite.load(d.servers);
          }, "json");
        },2000);
      }, "json");
    });
  },
  setupController: function (controller, model) {
    controller.set('model', model);
    controller.set('graph', false);
  }
});

var infobarViewInstance, infobarContentViewInstance;

App.NavView = Ember.View.extend({
  templateName: 'nav',
  didInsertElement: function(){
    var self = this;
    // Old code for dev/test/live.
    /*
    $('li.link').removeClass('active');
    $('li.link.' + App.env).addClass('active');
    $(window).on('hashchange', function() {
      $('li.link').removeClass('active');
      $('li.link.'+App.env).addClass('active');
    });*/

    // Array of environments.
    var environments = {
      'basic': 'Basic',
      'performancesmall': 'Performance (Small)',
      'performancemedium': 'Performance (Medium)',
      'performancelarge': 'Performance (Large)',
      'performancexl': 'Performance (Extra Large)',
      'elite': 'Elite',
      'elitemax': 'Elite (Traffic Spike)',
      'multiplesites': 'Select',
      'disaster': 'Select'
    };

    // Array of traffic strings.
    var traffic = {
      'basic': 'Up to 125K/month',
      'performancesmall': 'Up to 125K/month',
      'performancemedium': 'Up to 250K/month',
      'performancelarge': 'Up to 750K/month',
      'performancexl': 'Up to 1.5M/month',
      'elite': 'Unlimited',
      'elitemax': 'Unlimited++',
      'multiplesites': 'Up to 125K/month',
      'disaster': 'Up to 125K/month'
    };

    // New code for environments.
    $('li.dropdown ul li').removeClass('active');
    $('li.dropdown ul li.' + App.env).addClass('active');
    if (App.env != 'multiplesites' && App.env != 'disaster') {
      $('li.dropdown').addClass('highlighted');
    }
    else {
      $('li.dropdown').removeClass('highlighted');
    }
    $('#internet h5.subtitle').html(traffic[App.env]);
    // Switch name of environment in drop down.
    $('a.dropdown-toggle span').html(environments[App.env]);
    $(window).on('hashchange', function() {
      $('li.dropdown ul li').removeClass('active');
      $('li.dropdown ul li.' + App.env).addClass('active');
      $('a.dropdown-toggle span').html(environments[App.env]);
      if (App.env != 'multiplesites' && App.env != 'disaster') {
        $('li.dropdown').addClass('highlighted');
        $('#internet h5.subtitle').html(traffic[App.env]);
      }
      else {
        $('li.dropdown').removeClass('highlighted');
      }
    });
  },
});

App.InfobarView = Ember.View.extend({
  templateName: 'infobarContainer',
  didInsertElement: function(){
    var self = this;
    infobarViewInstance = self;
  },
  open: function(){
    var self = this;
    $("#infobarContainer").addClass("emerge");
    $("#ember248").addClass("emerge");
  },
  close: function(){
    var self = this;
    $("#infobarContainer").removeClass("emerge");
    $("#ember248").removeClass("emerge");
  }
});

App.InfobarContentView = Ember.View.extend({
  templateName: 'infobarContent',
  didInsertElement: function(){
    var self = this;
    infobarContentViewInstance = self;
    self.set("controller.title", "");
    self.set("controller.text", "");

    if(self.get("controller.node")){
      self.nodeChange();
    }
  },
  nodeChange : function(){
    var self = this;
    node = self.get("controller.node");
    if(node){
      self.set("controller.title", _marketing[node.type][0]);
      self.set("controller.text", _marketing[node.type][1]);
      var icoColor = "white";
      self.set("controller.icon", "/platform/img/" + node.type + ".svg");
      $("#infobarContainer").removeClass().addClass(node.type);
      $(".infobarContent").find("img.headerIcon").attr("src", "/platform/img/" + node.type + ".svg");
      infobarViewInstance.open();
    }
    else{
      infobarViewInstance.close();
    }
  }.observes("controller.node")
});

App.DiagramView = Ember.View.extend({
  templateName: 'diagram',
  didInsertElement: function(){
    var self = this;
    var graph = self.get("controller.graph");
    var mySite = App.mySite;//self.get('controller.model');
    var elementId = "#diagramContainer";
    //Set dimension of graphcontainer.
    var graphWidth = Math.min($("body").width(), maxWidth) - $("#infobarContainer").width();
    var graphHeight = 550;//$("body").height();
    // if(graphHeight < 600){
    //   graphHeight = 600;
    // }
    $(diagramContainer).width(graphWidth).height(graphHeight);
    $("#infobarContainer").height($("body").height());

    if(!graph){
      mySite.registerEvent("server.add",function(e){
        self.drawServer(e.server);
        self.drawAllLinks();
      });

      mySite.registerEvent("server.delete",function(e){
        self.undrawServer(e.server);
      });

      graph = new myGraph(elementId);
      graph.registerEvent("node.selected", function(e){
        infobarContentViewInstance.set("controller.node", e.node);
      });
      graph.registerEvent("node.unselected", function(e){
        if(infobarViewInstance.get("controller.node") == e.node){
          infobarContentViewInstance.set("controller.node", false);
        }
      });
      self.set('controller.graph', graph);
      self.draw();
    }
  },
  draw: function(){
    var self = this;
    var graph = self.get("controller.graph");
    var mySite = App.mySite;//self.get('controller.model');
    var instances = mySite.get([]);
    $.each(instances, function(i,e){
      self.drawServer(e);
    });
    self.drawAllLinks();
  },
  undrawServer: function(server){
    var self = this;
    var graph = self.get("controller.graph");
    graph.removeNode(server.id);
  },
  drawServer: function(server){
    var self = this;
    var graph = self.get("controller.graph");
    graph.addNode(server);
  },
  drawAllLinks: function(){
    var self = this;
    var mySite = App.mySite;//self.get('controller.model');
    var instances = mySite.get([]);
    $.each(instances, function(i,e){
      self.drawLinks(e);
    });
  },
  drawLinks: function(server){
    var self = this;
    var graph = self.get("controller.graph");
    $.each(server.links, function(i,e){
      graph.addLink(server.id, e);
    });
  }
});
